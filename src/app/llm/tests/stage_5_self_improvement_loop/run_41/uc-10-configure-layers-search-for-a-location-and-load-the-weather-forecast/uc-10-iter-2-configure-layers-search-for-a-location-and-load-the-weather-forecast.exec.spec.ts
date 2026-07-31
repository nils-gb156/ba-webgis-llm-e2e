// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // The layer switcher is already visible. The Temperature checkbox is checked.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show the Precipitation overlay layer.
  // The Precipitation checkbox is unchecked.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Assert layer state: Temperature should no longer be rendered, Precipitation should be rendered.
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for a location using the geocoder.
  await page.getByTestId('geocoder-input').fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  // The geocoder panel appears with search results.
  await expect(page.getByTestId('geocoder-panel')).toBeVisible();

  // Select the first result from the geocoder panel.
  // The first result has a specific test-id: geocoder-result-item-0
  await page.getByTestId('geocoder-result-item-0').click();

  // Step 5: Wait for the map to navigate to the selected location.
  // The map will pan/zoom to the selected place. We can assert the info panel updates.
  // We wait for the info panel to no longer show the initial "Click on the map..." message.
  await expect(page.getByTestId('info-panel')).not.toContainText('Click on the map to load a forecast.');

  // Step 6: Wait for the info panel to load the forecast.
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // The forecast entries are likely in a list or grid. We need to count them.
  // Based on the data-testids at failure, the entries have test-id "weather-forecast-entry".
  // We'll poll for the count of elements with this test-id to be 24.
  await expect.poll(async () => {
    const entries = page.getByTestId('weather-forecast-entry');
    const count = await entries.count();
    return count;
  }).toBe(24);
});
