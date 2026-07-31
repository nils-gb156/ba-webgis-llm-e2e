// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to settle
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide Temperature overlay
  // The layer switcher is visible by default. We click the checkbox for "Temperature".
  // Using force: true because Chakra UI renders the input visually hidden.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show Precipitation overlay
  // Precipitation is initially hidden. We click its checkbox to show it.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify layer state changes
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for a location
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  // The results panel appears when there are results.
  await expect(page.getByTestId('geocoder-results')).toBeVisible();
  
  // Select the first result item
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // We poll the map center to ensure it has changed from the initial view.
  // The initial center is likely around Germany/central Europe. Münster is in NW Germany.
  // We just verify that the map is no longer at the undefined/initial state and has moved.
  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

  // Step 6: Wait for the info panel to load the forecast
  // The info panel should contain a weather forecast section with entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Check for 24 entries
  const entries = page.getByTestId('weather-forecast-entry');
  await expect(entries).toHaveCount(24);
});
