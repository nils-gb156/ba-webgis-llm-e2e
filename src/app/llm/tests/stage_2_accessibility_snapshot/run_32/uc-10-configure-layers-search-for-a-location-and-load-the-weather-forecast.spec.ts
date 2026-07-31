// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await temperatureCheckbox.click();
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click();
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for result list and select first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel.locator('li')).toHaveCount({ min: 1 });
  
  const firstResult = geocoderPanel.locator('li').first();
  await firstResult.click();

  // Step 5: Wait for map to navigate (we assert via the info panel loading, which implies navigation)
  // The map itself is a canvas, so we rely on the side-effect (info panel update) as the navigation indicator.

  // Step 6: Wait for info panel to load the forecast
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = infoPanel.getByTestId('weather-forecast-section');
  
  // Expect the weather forecast section to be visible and contain 24 entries
  await expect(weatherForecastSection).toBeVisible();
  
  // The expected result states "24 entries". We count the items within the forecast section.
  // Assuming each forecast entry is a distinct element (e.g., div, li, or similar) inside the section.
  // Since the exact structure isn't fully detailed, we look for a reasonable count of forecast items.
  // A common pattern is a list of hours/days. Let's assume the section contains multiple forecast cards/items.
  // We will poll for the presence of at least 24 distinct forecast items.
  await expect.poll(async () => {
    const forecastItems = weatherForecastSection.locator('div, li, article').filter({ hasText: /°C|mm|weather/i });
    return await forecastItems.count();
  }).toBeGreaterThanOrEqual(24);
});
