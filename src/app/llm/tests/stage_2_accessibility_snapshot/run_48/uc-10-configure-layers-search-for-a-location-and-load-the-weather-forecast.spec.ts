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

  // Step 3: Search for a location
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const firstResult = geocoderPanel.getByRole('option').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We assert that the info panel is no longer in the "click to load" state
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel.getByText('Click on the map to load a forecast.')).not.toBeVisible();

  // Step 6: Wait for the info panel to load the forecast with 24 entries
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  
  // Count the forecast entries (assuming they are list items or similar structure within the section)
  // The prompt says "24 entries". We'll look for a container that holds these entries.
  // Often forecasts are rendered as a list. Let's assume the section contains the entries directly or in a list.
  // Since we don't have specific test ids for forecast items, we'll check for the presence of the section and
  // potentially count elements if they have a common role.
  // A safer bet is to wait for the section to be visible and contain some content, then verify the count if possible.
  // However, without specific structure, we can assert the section is visible and not empty.
  // Let's try to find a list within the weather forecast section.
  const forecastList = weatherForecastSection.getByRole('list');
  
  // If there is no explicit list role, we might need to count children or specific items.
  // Given the complexity, let's assume the entries are distinct elements.
  // We will poll for the weather section to have a reasonable amount of content.
  // A robust way is to check for the existence of the 24th entry if they are sequentially numbered or similar.
  // Without specific IDs, we'll assert the section is visible and contains text.
  // To strictly verify "24 entries", we might need to count specific items.
  // Let's assume the forecast entries are list items.
  
  await expect.poll(async () => {
    const count = await forecastList.count();
    return count;
  }).toBe(24);
});
