// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for map to be ready and initial layers to settle
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Hide Temperature layer
  // The layer switcher is visible by default. We find the toggle for "Temperature".
  // Since "Temperature" is visible by default, the toggle should be in "on" state.
  // We click it to turn it off.
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' }).first();
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // Step 2: Show Precipitation layer
  // Precipitation is initially hidden. We click its toggle to turn it on.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' }).first();
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Assert layer states
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  // Wait for the geocoder results panel to appear
  const geocoderResults = page.getByTestId('geocoder-results');
  await expect(geocoderResults).toBeVisible();

  // Select the first result
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate
  // The map should zoom/pan to the selected location.
  // We can assert this by checking the map center changes or just waiting for the info panel to update.
  // Let's wait for the info panel to start loading the forecast as a proxy for navigation completing.

  // Step 6: Wait for info panel to load the forecast
  // The info panel is visible by default. We look for the weather forecast section.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Wait for the forecast entries to appear. We expect 24 entries.
  const weatherForecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(async () => {
    const count = await weatherForecastEntries.count();
    return count;
  }).toBe(24);
});
