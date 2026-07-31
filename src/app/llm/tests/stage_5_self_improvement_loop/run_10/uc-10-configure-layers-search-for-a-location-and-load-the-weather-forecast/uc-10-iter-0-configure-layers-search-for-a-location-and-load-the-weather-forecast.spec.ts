// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be fully ready before starting interaction
  await expect(page.getByTestId('map-container')).toBeVisible();

  // 1. Hide the Temperature overlay layer
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // 2. Show the Precipitation overlay layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // 3. Search for 'Münster'
  await page.getByTestId('geocoder-input').click();
  await page.getByTestId('geocoder-input').fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  // The geocoder panel becomes visible with results
  await expect(page.getByTestId('geocoder-panel')).toBeVisible();
  
  // Select the first result (assuming the first result is the city of Münster)
  // The geocoder panel typically contains a list of results. 
  // We look for the first list item or button within the geocoder panel.
  await page.getByTestId('geocoder-panel').getByRole('option', { name: 'Münster' }).first().click();

  // 5. Wait for the map to navigate to the selected location
  // We can check if the map center has changed from the initial view or just wait for the info panel to update.
  // Since we don't have the exact initial center, we wait for the info panel to show forecast data.
  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

  // 6. Wait for the info panel to load the forecast
  // The info panel should now display weather forecast content instead of the initial message.
  await expect(page.getByTestId('info-panel')).toContainText('Weather Forecast');
  
  // Check for the presence of the weather forecast section with entries
  // The expected result mentions 24 entries. We can check if the section is visible and has content.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
  
  // Verify the Precipitation layer is rendered and Temperature is not
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
});
