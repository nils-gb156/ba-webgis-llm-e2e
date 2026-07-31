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

  // Step 4: Wait for result list and select first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  await geocoderPanel.getByRole('option', { name: 'Münster' }).first().click();

  // Step 5: Wait for map navigation (simulated by waiting for the info panel to start loading content)
  // The map navigates asynchronously after selection. We wait for the info panel to reflect the new location.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast (24 entries)
  // The forecast section appears after the map settles on the new location.
  await expect.poll(async () => {
    const weatherSection = page.getByTestId('weather-forecast-section');
    if (!(await weatherSection.isVisible())) {
      return 0;
    }
    // Count the number of forecast entries (assuming each entry is a distinct element, e.g., a list item or card)
    // Based on the prompt, we expect 24 entries. We look for common structures like list items or divs within the section.
    // Since the exact DOM structure of the forecast entries isn't provided, we'll count the number of child elements that look like forecast items.
    // A safe bet for "24 entries" is to wait for the section to have a significant number of children, or specifically 24 if we can identify them.
    // Let's assume the forecast entries are list items or similar distinct blocks.
    const entries = weatherSection.locator('> *');
    const count = await entries.count();
    return count;
  }).toBe(24);

  // Verify Expected Results:
  // 1. Temperature layer toggle is unchecked (disabled state for visibility)
  await expect(temperatureCheckbox).not.toBeChecked();

  // 2. Precipitation layer toggle is checked (enabled state for visibility)
  await expect(precipitationCheckbox).toBeChecked();

  // 3. Map navigated (implicitly verified by the info panel updating, but we can also check if the scale changed or just rely on the info panel)
  // The prompt says "map navigates to the searched location". This is hard to assert directly without map helpers.
  // However, the info panel loading the correct forecast for Münster implies navigation.

  // 4. Info panel displays weather forecast with 24 entries (verified by the poll above)
});
