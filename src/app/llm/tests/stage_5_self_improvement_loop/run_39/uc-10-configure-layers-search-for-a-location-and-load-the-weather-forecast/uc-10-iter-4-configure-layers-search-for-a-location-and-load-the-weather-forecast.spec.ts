// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  test.setTimeout(90000);

  const layerSwitcher = page.getByTestId('layer-switcher');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByTestId('geocoder-input');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const mapContainer = page.getByTestId('map-container');
  const footer = page.getByTestId('footer');

  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  const getNormalizedForecastText = async () => {
    return ((await weatherForecastSection.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  };

  const getForecastEntryCounts = async () => {
    return await weatherForecastSection.evaluate((section) => {
      const counts = new Set<number>();

      counts.add(section.querySelectorAll('li').length);
      counts.add(section.querySelectorAll('[role="listitem"]').length);

      const tbodyRowCount = section.querySelectorAll('tbody tr').length;
      if (tbodyRowCount > 0) {
        counts.add(tbodyRowCount);
      }

      const allRowCount = section.querySelectorAll('tr').length;
      if (allRowCount > 1) {
        counts.add(allRowCount - 1);
      }

      const informativeCount = (elements: Element[]) =>
        elements.filter((element) => {
          const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
          return text.length > 0 || element.querySelector('img, svg, canvas') !== null;
        }).length;

      for (const container of [section, ...Array.from(section.querySelectorAll('*'))]) {
        const children = Array.from(container.children);
        if (children.length === 0) {
          continue;
        }

        if (informativeCount(children) === children.length) {
          counts.add(children.length);
        }
      }

      return [...counts].sort((a, b) => a - b);
    });
  };

  await expect(layerSwitcher).toBeVisible();
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
      return Array.isArray(initialCenter) ? initialCenter.length : 0;
    })
    .toBe(2);

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
    .poll(async () => {
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
    }, { timeout: 30000 })
    .toBe('ready');

  if (resultLocatorType === 'option') {
    await resultOption.click();
  } else if (resultLocatorType === 'button') {
    await resultButton.click();
  } else if (resultLocatorType === 'text') {
    await resultText.click();
  } else {
    throw new Error('No geocoder result became selectable.');
  }

  await expect(geocoderInput).toHaveValue(/Münster/i);
  await expect(page.getByTestId('geocoder-clear-button')).toBeVisible();

  let highlightedCoordinate: [number, number] | undefined;
  await expect
    .poll(async () => {
      highlightedCoordinate = await getHighlightedCoordinate(page);
      return Array.isArray(highlightedCoordinate) ? highlightedCoordinate.length : 0;
    }, { timeout: 30000 })
    .toBe(2);

  if (!highlightedCoordinate) {
    throw new Error('Highlighted geocoder coordinate is not available.');
  }

  await expect
    .poll(async () => {
      const currentCenter = await getMapCenter(page);
      if (!currentCenter) {
        return 0;
      }
      const dx = currentCenter[0] - initialCenter[0];
      const dy = currentCenter[1] - initialCenter[1];
      return Math.hypot(dx, dy);
    }, { timeout: 30000 })
    .toBeGreaterThan(1000);

  await expect
    .poll(async () => {
      const currentCenter = await getMapCenter(page);
      if (!currentCenter) {
        return Number.POSITIVE_INFINITY;
      }
      const dx = currentCenter[0] - highlightedCoordinate[0];
      const dy = currentCenter[1] - highlightedCoordinate[1];
      return Math.hypot(dx, dy);
    }, { timeout: 30000 })
    .toBeLessThan(1000);

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

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box is not available.');
  }

  const layerSwitcherBox = await layerSwitcher.boundingBox();
  const infoPanelBox = await infoPanel.boundingBox();
  const geocoderPanelBox = await geocoderPanel.boundingBox();
  const footerBox = await footer.boundingBox();

  const leftLimit =
    layerSwitcherBox ? Math.max(20, Math.round(layerSwitcherBox.x + layerSwitcherBox.width - mapBox.x + 20)) : 20;
  const rightLimit =
    infoPanelBox ? Math.min(Math.round(mapBox.width - 20), Math.round(infoPanelBox.x - mapBox.x - 20)) : Math.round(mapBox.width - 20);
  const topLimit =
    geocoderPanelBox ? Math.max(20, Math.round(geocoderPanelBox.y + geocoderPanelBox.height - mapBox.y + 20)) : 20;
  const bottomLimit =
    footerBox ? Math.min(Math.round(mapBox.height - 20), Math.round(footerBox.y - mapBox.y - 20)) : Math.round(mapBox.height - 20);

  const unobscuredCenter = {
    x: Math.round(leftLimit < rightLimit ? (leftLimit + rightLimit) / 2 : mapBox.width / 2),
    y: Math.round(topLimit < bottomLimit ? (topLimit + bottomLimit) / 2 : mapBox.height / 2)
  };

  const rawCenter = {
    x: Math.round(mapBox.width / 2),
    y: Math.round(mapBox.height / 2)
  };

  const clickPositions =
    unobscuredCenter.x === rawCenter.x && unobscuredCenter.y === rawCenter.y
      ? [unobscuredCenter]
      : [unobscuredCenter, rawCenter];

  let forecastLoaded = false;

  for (const position of clickPositions) {
    await mapContainer.click({ position });

    let loadOutcome: 'loaded' | 'error' | 'unsettled' = 'unsettled';

    try {
      await expect
        .poll(async () => {
          const text = await getNormalizedForecastText();
          const counts = await getForecastEntryCounts();

          if (counts.includes(24)) {
            loadOutcome = 'loaded';
            return true;
          }

          if (/Fehler beim Laden der Wetterdaten/i.test(text)) {
            loadOutcome = 'error';
            return true;
          }

          return false;
        }, { timeout: 20000 })
        .toBe(true);
    } catch {
      loadOutcome = 'unsettled';
    }

    if (loadOutcome === 'loaded') {
      forecastLoaded = true;
      break;
    }
  }

  expect(forecastLoaded).toBe(true);
  await expect(weatherForecastSection).not.toContainText('Fehler beim Laden der Wetterdaten');
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast');
  await expect.poll(getForecastEntryCounts, { timeout: 30000 }).toContain(24);
});
