// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide Temperature overlay
  // The layer switcher is visible by default. We need to find the toggle for "Temperature".
  // Assuming the layer switcher items are accessible by role or text.
  // We look for the row/element containing "Temperature" and click its toggle.
  const temperatureRow = page.getByRole('row', { name: 'Temperature' }).first();
  // Or if it's a list item:
  const temperatureItem = page.getByRole('listitem', { name: 'Temperature' }).first();
  // Fallback to text if roles are not granular enough
  const temperatureToggle = temperatureItem.locator('button').first();
  
  // Check if Temperature is currently rendered (it should be, per preconditions)
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Click the toggle to hide Temperature
  await temperatureToggle.click();

  // Step 2: Show Precipitation overlay
  // Precipitation is initially hidden.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  const precipitationItem = page.getByRole('listitem', { name: 'Precipitation' }).first();
  const precipitationToggle = precipitationItem.locator('button').first();

  // Click the toggle to show Precipitation
  await precipitationToggle.click();

  // Verify Precipitation is now rendered
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Verify Temperature is now hidden
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  // The geocoder results panel should appear
  await expect(page.getByTestId('geocoder-results')).toBeVisible();

  // Select the first result item
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // The map should pan to the selected location.
  // We can check if the center has changed or if a highlight appears.
  // Since we don't know the exact coordinates, we wait for the geocoder panel to close or results to disappear,
  // indicating the selection was processed.
  await expect(page.getByTestId('geocoder-results')).not.toBeVisible();

  // Step 6: Wait for the info panel to load the forecast
  // The info panel should now contain the weather forecast section.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify the forecast has 24 entries
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
