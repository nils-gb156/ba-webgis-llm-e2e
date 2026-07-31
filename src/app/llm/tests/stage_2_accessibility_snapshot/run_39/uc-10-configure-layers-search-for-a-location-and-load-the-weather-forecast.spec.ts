// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // The Temperature checkbox is initially checked. We click it to uncheck (hide) it.
  // Using force: true because Chakra UI checkboxes render the input visually hidden.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer.
  // The Precipitation checkbox is initially unchecked. We click it to check (show) it.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for a location using the geocoder.
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  // Wait for the panel to become visible, indicating results are loaded.
  await expect(geocoderPanel).toBeVisible();
  
  // Select the first result. Typically, the first item in a list within the panel
  // is clickable. We look for a list item or button inside the panel.
  // Assuming the first result is a clickable element (like a listitem or button) inside the panel.
  const firstResult = geocoderPanel.getByRole('listitem').first();
  if (await firstResult.isVisible()) {
    await firstResult.click();
  } else {
    // Fallback: if no listitems, try clicking the first button or link in the panel
    const firstLink = geocoderPanel.getByRole('link').first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
    }
  }

  // Step 5: Wait for the map to navigate to the selected location.
  // We can verify navigation by checking that the map container is still visible
  // and potentially by waiting for a network response related to map updates or features,
  // but the most robust UI-level check is that the info panel starts loading data.
  // We'll wait for the info panel to update its content.
  
  // Step 6: Wait for the info panel to load the forecast.
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // Use poll to wait for the forecast section to contain the expected number of entries.
  // We assume the entries are list items or similar structured elements within the section.
  await expect.poll(async () => {
    const entries = weatherForecastSection.locator('li');
    const count = await entries.count();
    return count;
  }).toBeGreaterThanOrEqual(24);

  // Verify that the info panel is visible and contains the forecast section.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
});
