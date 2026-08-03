// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const geocoderInput = page.getByTestId('geocoder-input');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const mapContainer = page.getByTestId('map-container');

  await expect(layerSwitcher).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
  const initialCenter = await getMapCenter(page);
  if (!initialCenter) {
    throw new Error('Map center was not available after the map became ready.');
  }

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const optionResult = page.getByRole('option', { name: /Münster/i }).first();
  const buttonResult = page.getByRole('button', { name: /Münster/i }).first();
  const listItemResult = page.getByRole('listitem').filter({ hasText: /Münster/i }).first();

  await expect
    .poll(async () => {
      if ((await optionResult.count()) > 0) return 'option';
      if ((await buttonResult.count()) > 0) return 'button';
      if ((await listItemResult.count()) > 0) return 'listitem';
      return 'none';
    }, { timeout: 30000 })
    .not.toBe('none');

  let firstSearchResult = optionResult;
  if ((await optionResult.count()) > 0) {
    firstSearchResult = optionResult;
  } else if ((await buttonResult.count()) > 0) {
    firstSearchResult = buttonResult;
  } else {
    firstSearchResult = listItemResult;
  }

  await expect(firstSearchResult).toBeVisible();
  await firstSearchResult.click();

  await expect(geocoderInput).toHaveValue(/Münster/i);

  await expect.poll(async () => {
    const currentCenter = await getMapCenter(page);
    if (!currentCenter) {
      return 0;
    }
    const dx = currentCenter[0] - initialCenter[0];
    const dy = currentCenter[1] - initialCenter[1];
    return Math.hypot(dx, dy);
  }, { timeout: 30000 }).toBeGreaterThan(1000);

  await expect.poll(() => getHighlightedCoordinate(page), { timeout: 30000 }).not.toBeUndefined();

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box is not available.');
  }

  await mapContainer.click({
    position: {
      x: mapBox.width / 2,
      y: mapBox.height / 2
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
          return -1;
        }

        const liCount = section.querySelectorAll('li').length;
        if (liCount > 0) {
          return liCount;
        }

        const bodyRowCount = section.querySelectorAll('tbody tr').length;
        if (bodyRowCount > 0) {
          return bodyRowCount;
        }

        const allRowCount = section.querySelectorAll('tr').length;
        if (allRowCount > 1) {
          return allRowCount - 1;
        }

        const informativeCount = (elements: Element[]) =>
          elements.filter((element) => {
            const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
            return text.length > 0 || element.querySelector('img, svg, canvas') !== null;
          }).length;

        let best = 0;
        const containers = [section, ...Array.from(section.querySelectorAll('*'))];
        for (const container of containers) {
          const children = Array.from(container.children);
          if (children.length === 0) {
            continue;
          }

          if (informativeCount(children) === children.length) {
            best = Math.max(best, children.length);
          }

          const grandchildCounts = children.map((child) => {
            const grandchildren = Array.from(child.children);
            if (grandchildren.length === 0) {
              return 0;
            }
            return informativeCount(grandchildren) === grandchildren.length ? grandchildren.length : 0;
          });

          if (grandchildCounts.every((count) => count > 0)) {
            best = Math.max(best, grandchildCounts.reduce((sum, count) => sum + count, 0));
          }
        }

        return best;
      });
    }, { timeout: 30000 })
    .toBe(24);
});
