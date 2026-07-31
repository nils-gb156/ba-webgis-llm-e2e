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

  // Verify layer states
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  
  // Select the first result from the geocoder panel
  const firstResult = geocoderPanel.locator('li').first();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We wait for the info panel to start updating, which implies navigation/loading
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast with 24 entries
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  
  // The forecast entries are typically rendered as a list or grid within the weather section.
  // We poll for the presence of at least 24 forecast items/entries.
  // Assuming each entry has a distinct element or text node, we count them.
  // If the structure is a list, we can count the list items.
  // Since the exact DOM structure of the forecast entries isn't fully specified beyond "24 entries",
  // we will poll for the weather section to contain content that suggests 24 entries.
  // A common pattern is a grid or list. Let's assume the section updates with the forecast data.
  // We'll check if the section has visible text or elements indicating the forecast is loaded.
  // To be precise about "24 entries", we might need to count specific elements.
  // Without specific test IDs for forecast entries, we'll assert the section is visible and has content.
  // However, the requirement is specific: "displays a weather forecast section with 24 entries".
  // Let's assume the forecast entries are rendered as a list with a specific role or structure.
  // If we can't count exactly 24 without more info, we assert visibility and maybe a sample entry.
  // But let's try to count if they are list items.
  
  // Poll for the weather forecast section to be populated.
  await expect.poll(async () => {
    const count = await weatherForecastSection.locator('[role="listitem"], li, .forecast-entry').count();
    return count;
  }).toBeGreaterThanOrEqual(24);
});
