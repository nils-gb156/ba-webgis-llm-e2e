// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to be ready and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // Select the first result from the geocoder panel
  const firstResult = geocoderPanel.getByRole('option', { name: 'Münster' }).first();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We wait for the info panel to start loading or for the map container to be interactable
  // A simple wait for the geocoder panel to close or a network response is often sufficient
  await expect(geocoderPanel).not.toBeVisible();

  // Step 6: Wait for the info panel to load the forecast
  // The expected result is that the info panel displays a weather forecast section with 24 entries
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // Use expect.poll to wait for the forecast data to load and render
  await expect.poll(async () => {
    const section = page.getByTestId('weather-forecast-section');
    if (!(await section.isVisible())) {
      return 0;
    }
    // Count the number of forecast entries (assuming each entry is a distinct element, e.g., a list item or card)
    // Since the exact structure isn't provided, we'll check for the presence of the section and some content
    // A robust check would be to count specific elements representing forecast entries.
    // Assuming the section contains multiple items, we'll check if it's visible and has some text content.
    const content = await section.textContent();
    return content ? content.length : 0;
  }).toBeGreaterThan(0);

  // Verify the specific expected result: 24 entries
  // We need to identify the elements representing the 24 forecast entries.
  // Often, these might be list items or divs within the weather-forecast-section.
  // Without specific test IDs for each entry, we might rely on the structure.
  // Let's assume the forecast entries are list items within the section.
  const forecastEntries = weatherForecastSection.getByRole('listitem');
  await expect(forecastEntries).toHaveCount(24);
});
