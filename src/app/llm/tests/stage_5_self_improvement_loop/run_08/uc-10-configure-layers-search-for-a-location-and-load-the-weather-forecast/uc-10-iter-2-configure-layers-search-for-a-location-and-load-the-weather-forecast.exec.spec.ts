// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature layer
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // Step 2: Show the Precipitation layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list and select the first result
  await expect(page.getByTestId('geocoder-panel')).toBeVisible();
  await page.getByTestId('geocoder-result-item-0').click();

  // Step 5: Wait for the map to navigate to the selected location
  // The geocoder result centers the map. We poll the map center until it changes.
  const initialCenter = await getMapCenter(page);
  await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

  // Step 6: Wait for the info panel to load the forecast
  // The info panel is visible by default. We wait for the "Weather Forecast" heading
  // and then for the forecast section to appear with entries.
  await expect(page.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();
  
  // The forecast section should now contain entries.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
  
  // Verify the number of forecast entries (24)
  // The entries are likely in a list or grid. Let's count the items in the forecast section.
  // Assuming each entry is a distinct element (e.g., a card or list item).
  // A robust way is to check for the presence of the section and a reasonable number of items.
  // Let's assume the forecast entries are list items or similar.
  const forecastEntries = page.getByTestId('weather-forecast-section').locator('li, .forecast-entry, [class*="entry"]');
  await expect(forecastEntries).toHaveCount(24);
});
