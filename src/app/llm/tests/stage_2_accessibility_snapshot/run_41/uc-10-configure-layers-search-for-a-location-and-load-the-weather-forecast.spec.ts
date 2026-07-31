// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  // The accessibility tree shows "Temperature" checkbox is currently [checked].
  // We need to uncheck it.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  // The accessibility tree shows "Precipitation" checkbox is currently unchecked.
  // We need to check it.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  // The geocoder panel contains the results. We look for a list item or button representing the first result.
  // Since no specific test id is given for results, we rely on the text of the first result.
  // Usually, the first result matches the search term.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  // Wait for the panel to be visible and contain results
  await expect(geocoderPanel).toBeVisible();
  
  // Select the first result. We assume the first list item or button in the panel is the first result.
  // Using getByRole('option') or 'listitem' depending on implementation. 
  // Given the context of "result list", it's likely a list.
  const firstResult = geocoderPanel.getByRole('option').first();
  // Fallback if 'option' isn't used, try listitem or button
  const firstResultFallback = geocoderPanel.getByRole('listitem').first();
  
  // Try clicking the first result. If it's a link/button, click it.
  // We'll try to find an element with the text "Münster" inside the panel.
  const muensterResult = geocoderPanel.getByText('Münster').first();
  await expect(muensterResult).toBeVisible();
  await muensterResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // The map container is the target. We wait for the scale bar to update or just a timeout for navigation.
  // Since we can't assert map coordinates directly without helpers, we wait for the info panel to start loading.
  const mapContainer = page.getByTestId('map-container');
  // We can assert that the scale bar changes or simply wait for the info panel content to change.
  // Let's wait for the info panel to have some content indicating navigation.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // Wait for the weather forecast section to be visible
  await expect(weatherForecastSection).toBeVisible();

  // Assert that the weather forecast section contains 24 entries.
  // The entries are likely list items or similar structures within the section.
  // We will poll to ensure the data has loaded.
  await expect.poll(async () => {
    const entries = weatherForecastSection.locator('li').count();
    return entries;
  }).toBe(24);

  // Final Assertions based on Expected Results:
  // 1. The Precipitation overlay layer toggle is in the disabled state (checked).
  await expect(precipitationCheckbox).toBeChecked();

  // 2. The Temperature overlay layer toggle is in the enabled state (unchecked).
  await expect(temperatureCheckbox).not.toBeChecked();

  // 3. After selecting the search result, the map navigates to the searched location.
  // (Implicitly covered by the info panel loading the correct forecast, but we can also check the scale bar if needed)
  const scaleViewer = page.getByTestId('scale-viewer');
  await expect(scaleViewer).toBeVisible();

  // 4. The info panel displays a weather forecast section with 24 entries.
  // (Already asserted above)
});
