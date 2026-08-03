// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  const geocoderInput = page.getByTestId('geocoder-input');
  await expect(geocoderInput).toBeVisible();

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  let centerBeforeSearch: [number, number] | undefined;
  await expect
    .poll(async () => {
      centerBeforeSearch = await getMapCenter(page);
      return centerBeforeSearch !== undefined;
    })
    .toBe(true);

  if (!centerBeforeSearch) {
    throw new Error('Map center is not available before performing the geocoder search.');
  }

  await geocoderInput.click();
  await geocoderInput.fill('Münster');
  await expect(geocoderInput).toHaveValue('Münster');

  const firstSearchResult = page.getByText(/Münster/i).first();
  await expect(firstSearchResult).toBeVisible({ timeout: 15000 });
  await firstSearchResult.click();

  await expect(geocoderInput).toHaveValue(/Münster/i, { timeout: 15000 });

  await expect
    .poll(
      async () => {
        const centerAfterSearch = await getMapCenter(page);
        if (!centerAfterSearch) {
          return 0;
        }

        return Math.hypot(
          centerAfterSearch[0] - centerBeforeSearch[0],
          centerAfterSearch[1] - centerBeforeSearch[1]
        );
      },
      { timeout: 20000 }
    )
    .toBeGreaterThan(10000);

  await expect
    .poll(async () => {
      const highlight = await getHighlightedCoordinate(page);
      return highlight !== undefined;
    }, { timeout: 20000 })
    .toBe(true);

  await expect
    .poll(
      async () => {
        const centerAfterSearch = await getMapCenter(page);
        const highlight = await getHighlightedCoordinate(page);
        if (!centerAfterSearch || !highlight) {
          return Number.POSITIVE_INFINITY;
        }

        return Math.hypot(centerAfterSearch[0] - highlight[0], centerAfterSearch[1] - highlight[1]);
      },
      { timeout: 20000 }
    )
    .toBeLessThan(100000);

  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toContainText(/Location:\s*Münster/i, { timeout: 30000 });
  await expect(infoPanel).not.toContainText('Click on the map to load a forecast.');

  const weatherForecast = page.getByTestId('weather-forecast');
  await expect(weatherForecast).toBeVisible({ timeout: 30000 });

  const weatherForecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(weatherForecastEntries).toHaveCount(24, { timeout: 30000 });

  await expect(temperatureCheckbox).not.toBeChecked();
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
});
