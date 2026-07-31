// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // The accessibility tree shows "Temperature" checkbox is currently [checked].
  // We force click because Chakra UI checkboxes are visually hidden inputs.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await temperatureCheckbox.click({ force: true });

  // Step 2: Show the Precipitation overlay layer.
  // The accessibility tree shows "Precipitation" checkbox is currently unchecked.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Step 3: Search for a location.
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  // Wait for the panel to be visible, implying results have loaded.
  await expect(geocoderPanel).toBeVisible();
  
  // Select the first result item.
  const firstResult = geocoderPanel.getByRole('option', { name: /Münster/ }).first();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location.
  // We verify navigation by checking that the scale changes or simply by waiting
  // for the info panel to update, which implies the map has centered.
  // A robust check is to wait for the info panel to stop showing the "Click on the map..." message
  // and start showing forecast data.

  // Step 6: Wait for the info panel to load the forecast.
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // The info panel should contain the weather forecast section.
  // We poll for the forecast section to be visible and contain entries.
  await expect.poll(() => weatherForecastSection.isVisible()).toBe(true);
  
  // Verify the info panel displays a weather forecast section with 24 entries.
  // We count the number of items in the forecast section.
  const forecastEntries = weatherForecastSection.getByRole('listitem');
  await expect(forecastEntries).toHaveCount(24);

  // Verify expected results regarding layer toggles.
  // Step 1 result: Temperature layer toggle should be unchecked (disabled state in terms of visibility).
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2 result: Precipitation layer toggle should be checked (enabled state in terms of visibility).
  await expect(precipitationCheckbox).toBeChecked();
});
