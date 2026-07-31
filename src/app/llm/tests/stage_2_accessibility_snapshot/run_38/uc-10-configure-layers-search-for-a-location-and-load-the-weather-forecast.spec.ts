// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // The Temperature checkbox is checked initially. We need to click it to uncheck it.
  // Using force: true because Chakra UI renders the input visually hidden.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer.
  // The Precipitation checkbox is unchecked initially. We need to click it to check it.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3 & 4: Search for 'Münster' and select the first result.
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Wait for the geocoder panel to appear and contain results
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // Select the first result. The first item in the list is usually the primary match.
  // We look for the first list item within the geocoder panel.
  const firstResult = geocoderPanel.locator('li').first();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location.
  // We can assert that the scale bar or map container reflects the new state,
  // or simply wait for the info panel to start loading content.
  // A robust check is to wait for the info panel to show the weather forecast section.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // Step 6: Wait for the info panel to load the forecast.
  // Expected result: The info panel displays a weather forecast section with 24 entries.
  await expect(weatherForecastSection).toBeVisible();
  
  // Assert that there are 24 entries in the weather forecast section.
  // Assuming each entry is a distinct element (e.g., a div or list item) within the section.
  const forecastEntries = weatherForecastSection.locator('> *');
  await expect(forecastEntries).toHaveCount(24);
});
