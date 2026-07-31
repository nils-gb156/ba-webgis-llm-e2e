// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature layer
  // The Temperature checkbox is currently checked. We click it to hide it.
  // Using force: true because Chakra UI renders the input visually hidden.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
  // Wait for the layer to be removed from the map model
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // Step 2: Show the Precipitation layer
  // The Precipitation checkbox is currently unchecked. We click it to show it.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });
  // Wait for the layer to be rendered in the map model
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  // The geocoder panel becomes visible when results are available.
  await expect(page.getByTestId('geocoder-panel')).toBeVisible();
  
  // The first result has a specific test id: geocoder-result-item-0
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We poll the map center until it changes from the initial state.
  const initialCenter = await getMapCenter(page);
  // Wait for the center to change, indicating navigation
  await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

  // Step 6: Wait for the info panel to load the forecast
  // The info panel is visible by default. We wait for the "Weather Forecast" heading.
  await expect(page.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();
  
  // The forecast section should now be visible.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
  
  // Verify the number of forecast entries (24).
  // The entries are likely in a list or grid within the weather-forecast-section.
  // We need to find the correct locator for the entries.
  // Let's try to find list items or elements with a specific class inside the section.
  // If the structure is not known, we can try to count elements that look like entries.
  // A common pattern is a list of items. Let's try to find 'li' or elements with a class containing 'entry'.
  const forecastEntries = page.getByTestId('weather-forecast-section').locator('li, [class*="entry"], [class*="forecast-item"]');
  
  // Wait for the entries to appear and have the expected count.
  await expect.poll(async () => {
      return await forecastEntries.count();
  }).toBe(24);
});
