// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  // The layer switcher is open by default. We click the Temperature checkbox to uncheck it.
  // Using force: true because Chakra UI renders the input visually hidden.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  // Click the Precipitation checkbox to check it.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  // The geocoder panel appears with search results. We wait for the first result item to be visible.
  // Assuming the first result is a list item or button within the geocoder panel.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  // Wait for the panel to be visible (which implies results have loaded)
  await expect(geocoderPanel).toBeVisible();
  
  // Select the first result. Usually the first item in the dropdown/list.
  // We look for the first interactive element inside the panel that represents a result.
  // Often this is a list item or a button. Let's try to find the first list item or similar.
  // If the structure is a list, we might get the first li or a specific result locator.
  // Without specific test ids for results, we rely on the panel visibility and selecting the first clickable item.
  // A common pattern is that the results are in a list. Let's try to get the first list item or button in the panel.
  const firstResult = geocoderPanel.locator('li, button').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // The map container is the target. We can assert the scale changes or just wait for the info panel to update.
  // Since map state isn't in DOM, we wait for the info panel to reflect the new location/forecast.
  
  // Step 6: Wait for the info panel to load the forecast
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();
  
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  // We look for the weather forecast section.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  
  // Check for 24 entries. The entries might be list items or specific elements within the forecast section.
  // Let's assume they are list items or divs within the weather forecast section.
  // We will poll for the count of entries.
  await expect.poll(() => weatherForecastSection.locator('li, div').count()).toBe(24);

  // Verify layer states as per expected results
  // Temperature should be unchecked (disabled state in terms of visibility toggle usually means unchecked)
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
  
  // Precipitation should be checked
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();
});
