// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // 2. Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // 3. Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel.locator('li')).toHaveCount({ gt: 0 }, { timeout: 10000 });

  const firstResult = geocoderPanel.locator('li').first();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location
  // We verify navigation by checking that the info panel is no longer showing the initial "Click on the map..." message
  // and instead shows content or the weather forecast section.
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  // The info panel should update its content. We wait for the weather forecast section to appear
  // or for the initial instructional paragraph to disappear.
  await expect(weatherForecastSection).toBeVisible({ timeout: 15000 });

  // 6. Verify the info panel displays a weather forecast section with 24 entries
  // We poll because the forecast data loads asynchronously.
  await expect.poll(async () => {
    const items = await weatherForecastSection.locator('li').count();
    return items;
  }).toBe(24);
});
