// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature layer
  // The layer switcher is visible by default. We need to find the checkbox for "Temperature".
  // Based on the UI map, operational layers are in a checkbox-list.
  // We look for the checkbox labeled "Temperature" within the layer-switcher.
  const temperatureCheckbox = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked(); // Verify initial state
  await temperatureCheckbox.click({ force: true }); // Use force: true for Chakra UI checkbox
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show Precipitation layer
  // Precipitation is initially hidden.
  const precipitationCheckbox = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked(); // Verify initial state
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select first result
  // The results list appears after typing. We wait for the first result item to be visible.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate
  // We poll the map center to ensure it has changed from the initial extent.
  // We don't know the exact coordinates, but we expect the map to move.
  const initialCenter = await getMapCenter(page);
  await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);
  
  // Also verify zoom level is reasonable (map should have zoomed in somewhat)
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  // Step 6: Wait for weather forecast to load
  // The info panel is visible. The weather forecast section appears after clicking the map or navigating.
  // The UI map says weather-forecast appears after clicking map-container, but here we navigated via geocoder.
  // Usually, geocoder selection also triggers a map click or feature info request.
  // We wait for the weather-forecast section to become visible.
  const weatherForecastSection = page.getByTestId('weather-forecast');
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: Info panel displays a weather forecast section with 24 entries.
  // We count the number of weather-forecast-entry elements.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
