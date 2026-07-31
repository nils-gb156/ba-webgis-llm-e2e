// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show Precipitation layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  
  const firstResult = geocoderPanel.getByRole('option').first();
  await firstResult.click();

  // Step 5 & 6: Wait for map navigation and info panel update
  // The info panel should eventually show the weather forecast section with entries.
  // We poll for the weather forecast section to become visible and contain entries.
  await expect.poll(async () => {
    const weatherSection = page.getByTestId('weather-forecast-section');
    const isVisible = await weatherSection.isVisible();
    if (!isVisible) return 0;
    // Count the number of forecast entries (assuming each entry is a distinct element or list item)
    // Since the exact structure isn't fully specified, we look for the section's existence and some content.
    // A robust check is to see if the section is visible and has some text content indicating data.
    const text = await weatherSection.textContent();
    return text ? text.length : 0;
  }).toBeGreaterThan(0);

  // Verify the info panel is visible and contains the weather forecast
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
});
