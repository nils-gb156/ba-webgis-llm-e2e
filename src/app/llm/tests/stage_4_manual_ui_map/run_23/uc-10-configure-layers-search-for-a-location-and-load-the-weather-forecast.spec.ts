// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Store initial map state to verify navigation happened
  const initialCenter = await getMapCenter(page);
  const initialZoom = await getMapZoomLevel(page);

  // Step 1: Hide Temperature layer
  // The prompt implies Temperature is initially visible. We click its toggle to hide it.
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  // Step 2: Show Precipitation layer
  // The prompt implies Precipitation is initially hidden. We click its toggle to show it.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Search for a location
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  // The results list appears after typing. We wait for the first result item to be visible.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // The map center should change from the initial view to the searched location.
  // We poll until the center is different from the initial center.
  await expect.poll(async () => {
    const center = await getMapCenter(page);
    if (!initialCenter || !center) return false;
    return center[0] !== initialCenter[0] || center[1] !== initialCenter[1];
  }).toBeTruthy();

  // Step 6: Wait for info panel to load the forecast
  // The forecast section appears after clicking the map or navigating.
  // We wait for the weather forecast container to be visible.
  const weatherForecastSection = page.getByTestId('weather-forecast');
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // We poll for the number of forecast entries to reach 24.
  await expect.poll(async () => {
    const entries = page.getByTestId('weather-forecast-entry');
    return await entries.count();
  }).toBe(24);
});
