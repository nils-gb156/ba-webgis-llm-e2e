// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  test.setTimeout(60000);

  const layerSwitcher = page.getByTestId('layer-switcher');
  const geocoderInput = page.getByTestId('geocoder-input');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const mapContainer = page.getByTestId('map-container');

  await expect(layerSwitcher).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).toContainText(/Click on the map to load a forecast/i);
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await expect(page.getByTestId('temperature-legend')).toBeVisible();
  await expect(page.getByTestId('precipitation-legend')).toHaveCount(0);

  let initialCenter: [number, number] | undefined;
  await expect
    .poll(async () => {
      initialCenter = await getMapCenter(page);
      return initialCenter ? 'ready' : 'pending';
    })
    .toBe('ready');

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

  const resultOption = geocoderPanel.getByRole('option', { name: /Münster/i }).first();
  const resultButton = geocoderPanel.getByRole('button', { name: /Münster/i }).first();
  const resultText = geocoderPanel.getByText(/Münster/i).first();

  await expect
    .poll(async () => {
      if (await resultOption.isVisible().catch(() => false)) return 'option';
      if (await resultButton.isVisible().catch(() => false)) return 'button';
      if (await resultText.isVisible().catch(() => false)) return 'text';
      return 'none';
    }, { timeout: 30000 })
    .not.toBe('none');

  if (await resultOption.isVisible().catch(() => false)) {
    await resultOption.click();
  } else if (await resultButton.isVisible().catch(() => false)) {
    await resultButton.click();
  } else {
    await resultText.click();
  }

  await expect(geocoderInput).toHaveValue(/Münster/i);

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

  let highlightedCoordinate: [number, number] | undefined;
  await expect
    .poll(async () => {
      highlightedCoordinate = await getHighlightedCoordinate(page);
      return highlightedCoordinate ? 'ready' : 'pending';
    }, { timeout: 30000 })
    .toBe('ready');

  if (!highlightedCoordinate) {
    throw new Error('Highlighted geocoder coordinate is not available.');
  }

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
    .toBeLessThan(10000);

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box is not available.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(mapBox.width / 2 + 35),
      y: Math.round(mapBox.height / 2 + 35)
    }
  });

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  await expect
    .poll(async () => {
      const text = (await weatherForecastSection.textContent()) ?? '';
      return text.replace(/\s+/g, ' ').trim();
    }, { timeout: 30000 })
    .not.toMatch(/Fehler beim Laden der Wetterdaten|Click on the map to load a forecast/i);

  await expect
    .poll(async () => {
      return await weatherForecastSection.evaluate((section) => {
        const normalizedText = section.textContent?.replace(/\s+/g, ' ').trim() ?? '';
        if (
          /Fehler beim Laden der Wetterdaten/i.test(normalizedText) ||
          /Click on the map to load a forecast/i.test(normalizedText)
        ) {
          return false;
        }

        const exactCounts = new Set<number>();

        exactCounts.add(section.querySelectorAll('li').length);
        exactCounts.add(section.querySelectorAll('[role="listitem"]').length);

        const tbodyRowCount = section.querySelectorAll('tbody tr').length;
        if (tbodyRowCount > 0) {
          exactCounts.add(tbodyRowCount);
        }

        const allRowCount = section.querySelectorAll('tr').length;
        if (allRowCount > 1) {
          exactCounts.add(allRowCount - 1);
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
            exactCounts.add(children.length);
          }
        }

        return exactCounts.has(24);
      });
    }, { timeout: 30000 })
    .toBe(true);
});
