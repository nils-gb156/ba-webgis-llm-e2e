// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  
  // The first result usually has the same name or a specific role.
  // We look for the first list item or link within the panel.
  const firstResult = geocoderPanel.getByRole('option').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We wait for the info panel to start loading or for the map to settle.
  // Since we can't assert map coordinates directly without helpers, we wait for the
  // info panel content to change or appear.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast (24 entries)
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Assert that there are 24 forecast entries
  // The entries are likely in a list or grid within the weather forecast section.
  // We count the items inside the section.
  const forecastEntries = weatherForecastSection.locator('li, [role="listitem"], .forecast-item');
  await expect(forecastEntries).toHaveCount(24);
});
