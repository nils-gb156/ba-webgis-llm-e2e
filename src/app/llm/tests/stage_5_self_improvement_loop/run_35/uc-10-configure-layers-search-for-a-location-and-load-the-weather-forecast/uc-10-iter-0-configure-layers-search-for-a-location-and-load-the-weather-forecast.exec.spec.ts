// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Verify layer visibility via map model helpers
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  const firstResult = geocoderPanel.getByRole('option', { name: 'Münster' }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // The map should have moved from the initial extent to Münster.
  const initialCenter = await page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: { olMap?: { getView: () => { getCenter: () => number[] } } } }).__openPioneerMap;
    return map?.olMap?.getView()?.getCenter();
  });
  // Münster is roughly at [820000, 5950000] in EPSG:3857
  // We assert that the center has changed significantly from the initial center.
  await expect.poll(async () => {
    const newCenter = await page.evaluate(() => {
      const map = (globalThis as { __openPioneerMap?: { olMap?: { getView: () => { getCenter: () => number[] } } } }).__openPioneerMap;
      return map?.olMap?.getView()?.getCenter();
    });
    if (!newCenter || !initialCenter) return false;
    const dx = Math.abs(newCenter[0] - initialCenter[0]);
    const dy = Math.abs(newCenter[1] - initialCenter[1]);
    return dx > 100000 && dy > 100000;
  }).toBe(true);

  // Step 6: Wait for the info panel to load the forecast
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // We count the number of forecast entries (typically list items or similar elements within the section)
  const forecastEntries = weatherForecastSection.locator('li').or(weatherForecastSection.locator('[data-testid^="forecast-entry"]'));
  await expect(forecastEntries).toHaveCount(24);
});
