// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for a location
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  // The geocoder panel should appear with results
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // Select the first result (assuming the first list item or link is the first result)
  // We look for the first clickable element inside the geocoder panel that represents a result.
  // Often this is a list item or a button. Let's try to click the first item in the panel.
  const firstResult = geocoderPanel.locator('li').first();
  if (await firstResult.isVisible()) {
    await firstResult.click();
  } else {
    // Fallback: click the first link or button if not in a list
    const firstLink = geocoderPanel.locator('a').first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
    }
  }

  // Step 5: Wait for map to navigate
  // We can wait for the geocoder panel to close or for the map to stabilize.
  // A good indicator is the info panel updating or the geocoder panel disappearing.
  // Let's wait for the geocoder panel to disappear as a sign of selection completion.
  await expect(geocoderPanel).not.toBeVisible({ timeout: 10000 });

  // Step 6: Wait for info panel to load the forecast
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // We poll for the number of entries in the weather forecast section.
  // Assuming each entry is a list item or a specific element within the section.
  // Let's count the number of child elements that look like forecast entries.
  // A common pattern is a list of cards or rows.
  await expect.poll(async () => {
    const entries = weatherForecastSection.locator('> *'); // Direct children as potential entries
    const count = await entries.count();
    return count;
  }).toBeGreaterThanOrEqual(24);

  // Additional assertions from expected results:
  // - The Precipitation overlay layer toggle is in the enabled state (checked).
  await expect(precipitationCheckbox).toBeChecked();

  // - The Temperature overlay layer toggle is in the disabled state (unchecked).
  await expect(temperatureCheckbox).not.toBeChecked();
});
