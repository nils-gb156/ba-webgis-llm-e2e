// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // The accessibility tree shows the Temperature checkbox is initially [checked].
  // We need to uncheck it. Chakra UI checkboxes require force: true.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer.
  // The accessibility tree shows the Precipitation checkbox is initially unchecked.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for a location using the geocoder.
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  // The geocoder panel contains the results. We look for the first item in the panel.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  // Wait for the panel to be visible, implying results are loaded.
  await expect(geocoderPanel).toBeVisible();
  
  // Select the first result. Usually, geocoder results are in a list within the panel.
  // We assume the first list item or button in the panel is the first result.
  const firstResult = geocoderPanel.locator('li').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location.
  // We wait for the info panel to update, which indicates the map navigation and data loading.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast.
  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // We look for the weather forecast section and count its entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // Use expect.poll to wait for the forecast data to settle (24 entries).
  await expect.poll(async () => {
    // Count the number of forecast entries in the weather forecast section.
    // Assuming each entry is a distinct element (e.g., li, div) within the section.
    const entries = await weatherForecastSection.locator('> *').count();
    return entries;
  }).toBe(24);
});
