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

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  
  // The first result is usually the most relevant match.
  // We look for a list item or button within the panel that corresponds to the first result.
  // Assuming the panel renders a list of results, we click the first one.
  const firstResult = geocoderPanel.locator('li').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate (we can't assert map coordinates directly, 
  // but we can assert that the info panel has updated with new content)
  
  // Step 6: Wait for the info panel to load the forecast
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Expected results verification:
  
  // 1. Temperature layer toggle should be unchecked (disabled/hidden)
  await expect(temperatureCheckbox).not.toBeChecked();

  // 2. Precipitation layer toggle should be checked (enabled/shown)
  await expect(precipitationCheckbox).toBeChecked();

  // 3. Info panel displays a weather forecast section with 24 entries
  // The prompt mentions "weather-forecast-section" test id.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // We need to verify there are 24 entries. 
  // The structure inside weather-forecast-section likely contains 24 items.
  // We will poll for the count of child elements representing the forecast entries.
  // Assuming each entry is a distinct element (e.g., a div or li) within the section.
  // If the exact structure isn't known, we look for a reasonable indicator of 24 items.
  // Let's assume the entries are direct children or have a specific role.
  // Without specific test IDs for entries, we might count visible elements inside the section.
  
  // Using expect.poll to wait for the content to settle
  await expect.poll(async () => {
    const entries = await weatherForecastSection.locator('> *').count();
    return entries;
  }).toBe(24);
});
