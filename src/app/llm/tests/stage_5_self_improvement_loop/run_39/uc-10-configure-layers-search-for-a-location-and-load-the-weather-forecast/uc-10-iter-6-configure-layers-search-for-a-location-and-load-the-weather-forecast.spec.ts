// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByTestId('geocoder-input');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');

  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  const getForecastState = async () => {
    return await weatherForecastSection.evaluate((section) => {
      const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
      const text = normalize(section.textContent);
      const counts = new Set<number>();

      const addCount = (value: number) => {
        if (Number.isFinite(value) && value > 0) {
          counts.add(value);
        }
      };

      addCount(section.querySelectorAll('tbody tr').length);
      addCount(section.querySelectorAll('li').length);
      addCount(section.querySelectorAll('[role="listitem"]').length);
      addCount(section.querySelectorAll('article').length);

      for (const container of [section, ...Array.from(section.querySelectorAll('*'))]) {
        const children = Array.from(container.children).filter((child) => {
          const childText = normalize(child.textContent);
          return childText.length > 0 || child.querySelector('img, svg, canvas') !== null;
        });

        addCount(children.length);
      }

      return {
        text,
        counts: [...counts].sort((a, b) => a - b)
      };
    });
  };

  await expect(layerSwitcher).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText(/Click on the map to load a forecast/i);
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  let initialCenter: [number, number] | undefined;
  await expect
    .poll(async () => {
      initialCenter = await getMapCenter(page);
      return initialCenter;
    })
    .toEqual(expect.any(Array));

  if (!initialCenter) {
    throw new Error('Initial map center is not available.');
  }

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect(page.getByTestId('temperature-legend')).toHaveCount(0);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
  await expect(page.getByTestId('precipitation-legend')).toBeVisible();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const resultOption = geocoderPanel.getByRole('option').filter({ hasText: /Münster/i }).first();
  const resultButton = geocoderPanel.getByRole('button').filter({ hasText: /Münster/i }).first();
  const resultText = geocoderPanel.getByText(/Münster/i).first();

  let resultLocatorType: 'option' | 'button' | 'text' | 'none' = 'none';
  await expect
    .poll(
      async () => {
        if (await resultOption.isVisible().catch(() => false)) {
          resultLocatorType = 'option';
          return 'ready';
        }
        if (await resultButton.isVisible().catch(() => false)) {
          resultLocatorType = 'button';
          return 'ready';
        }
        if (await resultText.isVisible().catch(() => false)) {
          resultLocatorType = 'text';
          return 'ready';
        }
        resultLocatorType = 'none';
        return 'pending';
      },
      { timeout: 30000 }
    )
    .toBe('ready');

  if (resultLocatorType === 'option') {
    await resultOption.click();
  } else if (resultLocatorType === 'button') {
    await resultButton.click();
  } else if (resultLocatorType === 'text') {
    await resultText.click();
  } else {
    throw new Error('No selectable geocoder result became visible.');
  }

  await expect(geocoderInput).toHaveValue(/Münster/i);
  await expect(page.getByRole('button', { name: 'Clear search', exact: true })).toBeVisible();

  let highlightedCoordinate: [number, number] | undefined;
  await expect
    .poll(async () => {
      highlightedCoordinate = await getHighlightedCoordinate(page);
      return highlightedCoordinate;
    }, { timeout: 30000 })
    .toEqual(expect.any(Array));

  await expect
    .poll(async () => {
      const currentCenter = await getMapCenter(page);
      if (!currentCenter) {
        return 0;
      }
      return Math.hypot(currentCenter[0] - initialCenter[0], currentCenter[1] - initialCenter[1]);
    }, { timeout: 30000 })
    .toBeGreaterThan(1000);

  await expect
    .poll(async () => {
      const currentCenter = await getMapCenter(page);
      const currentHighlight = await getHighlightedCoordinate(page);
      if (!currentCenter || !currentHighlight) {
        return Number.POSITIVE_INFINITY;
      }
      return Math.hypot(currentCenter[0] - currentHighlight[0], currentCenter[1] - currentHighlight[1]);
    }, { timeout: 30000 })
    .toBeLessThan(5000);

  let previousCenter: [number, number] | undefined;
  await expect
    .poll(async () => {
      const currentCenter = await getMapCenter(page);
      if (!currentCenter) {
        return false;
      }
      const stable =
        previousCenter !== undefined &&
        Math.hypot(currentCenter[0] - previousCenter[0], currentCenter[1] - previousCenter[1]) < 1;
      previousCenter = currentCenter;
      return stable;
    }, { timeout: 30000 })
    .toBe(true);

  await expect(mapContainer).toBeVisible();
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  let forecastLoaded = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    await mapContainer.click({
      position: {
        x: Math.floor(box.width / 2),
        y: Math.floor(box.height / 2)
      }
    });

    try {
      await expect
        .poll(
          async () => {
            const { counts } = await getForecastState();
            return counts.includes(24);
          },
          { timeout: 30000 }
        )
        .toBe(true);
      forecastLoaded = true;
      break;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }
    }
  }

  expect(forecastLoaded).toBe(true);
  await expect
    .poll(async () => {
      const { text } = await getForecastState();
      return text;
    })
    .not.toMatch(/Fehler beim Laden der Wetterdaten/i);
  await expect(weatherForecastSection).not.toContainText(/Click on the map to load a forecast/i);
  await expect
    .poll(async () => {
      const { counts } = await getForecastState();
      return counts.includes(24);
    })
    .toBe(true);
});
