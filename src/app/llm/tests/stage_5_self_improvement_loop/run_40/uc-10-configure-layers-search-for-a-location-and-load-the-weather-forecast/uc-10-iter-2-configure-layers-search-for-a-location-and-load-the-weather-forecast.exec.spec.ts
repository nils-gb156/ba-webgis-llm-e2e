// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // 2. Show the Precipitation overlay layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // 3. Wait for the layer state changes to settle
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 4. Click the search field and type a place name
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 5. Wait for the result list to appear and select the first result
  // The first result is "Münster, North Rhine-Westphalia, Germany"
  await page.getByTestId('geocoder-result-item-0').click();

  // 6. Wait for the map to navigate to the selected location
  // The center should change from the initial extent to the location of Münster
  const initialCenter = await getMapCenter(page);
  await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

  // 7. Wait for the info panel to load the forecast (24 entries)
  // The weather forecast section should contain 24 list items
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  await expect.poll(() => weatherForecastSection.locator('[data-testid="weather-forecast-entry"]').count()).toBe(24);
});
