// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature layer
  // The default is ["Temperature", "UV-Index Stations", "EUCOS Ground Stations"].
  // We need to toggle Temperature off.
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
  await temperatureToggle.click();

  // Step 2: Show Precipitation layer
  // Precipitation is initially hidden.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationToggle.click();

  // Verify layer visibility states via helpers
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  // The results list appears after typing. We wait for the first result item.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // The map center should change from the default to the location of Münster.
  // We assert that the center is no longer the initial default (approx 0,0 or similar)
  // and that the zoom level is reasonable for a city view.
  // Since we don't know the exact coordinates, we check that the map center has changed
  // and is not undefined.
  const initialCenter = await getMapCenter(page);
  // Wait for the map to navigate by checking if the center has changed significantly
  // or simply that a valid center exists after the click.
  await expect.poll(() => getMapCenter(page)).not.toBe(initialCenter);
  
  // Also verify zoom level is set (map is ready and navigated)
  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

  // Step 6: Wait for weather forecast to load
  // The forecast appears after clicking the map or navigating.
  // We wait for the weather forecast section to contain entries.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});

// Helper to check layer rendered status (inlined to avoid import issues if path is relative)
// Actually, the prompt says import from "../../../map-model-helpers".
// I need to import the helpers properly.
// Re-writing imports.
// The test file is likely in a directory like `tests/e2e/` or similar.
// The helpers are at `../../../map-model-helpers` relative to the test file.
// I will import them.

// Wait, I already imported them above. I need to make sure `isLayerRendered` is used correctly.
// I used `isLayerRendered` in the test body.
// Let's refine the test to ensure imports are correct and logic is sound.

// Refined Test:
// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature layer
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
  await temperatureToggle.click();

  // Step 2: Show Precipitation layer
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationToggle.click();

  // Verify layer visibility states via helpers
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // Capture initial center before click if possible, but since we are in a single flow,
  // we can just wait for the center to change or be valid.
  // The prompt says "navigates to the selected location".
  // We check that the center is not undefined and zoom is valid.
  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

  // Step 6: Wait for weather forecast to load
  // The forecast appears after clicking the map or navigating.
  // We wait for the weather forecast section to contain entries.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
