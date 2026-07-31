// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });

  // Step 3 & 4: Search for 'Münster' and select the first result
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.fill('Münster');

  // Wait for the geocoder panel to appear and contain results
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // Select the first result (typically the most relevant match)
  const firstResult = geocoderPanel.getByRole('option').first();
  await firstResult.click();

  // Step 5: Wait for the map to navigate (wait for a network response that likely updates map state or loads new data)
  // Since we don't have specific map helpers, we wait for the info panel to start updating, which implies navigation.
  // We also wait for the geocoder panel to close or for the map to be interactable.
  await expect(geocoderPanel).not.toBeVisible();

  // Step 6: Wait for the info panel to load the forecast
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // Wait for the forecast section to become visible and contain data
  await expect(weatherForecastSection).toBeVisible();

  // Assert that the forecast section has loaded entries.
  // The expected result is 24 entries. We look for list items or similar structure within the forecast section.
  // Assuming the forecast entries are rendered as list items or similar distinct elements within the section.
  // If the structure is a list, we can count the items.
  const forecastEntries = weatherForecastSection.getByRole('listitem');
  await expect.poll(() => forecastEntries.count()).toBeGreaterThanOrEqual(24);

  // Additional assertions on layer states
  // Step 1 result: Temperature toggle should be unchecked (disabled/hidden state in UI context usually means unchecked)
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2 result: Precipitation toggle should be checked (enabled/visible state)
  await expect(precipitationCheckbox).toBeChecked();
});
