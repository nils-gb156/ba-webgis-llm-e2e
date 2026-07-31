// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  // The layer switcher is already open. We find the Temperature checkbox and click it.
  // Since Chakra UI checkboxes have hidden inputs, we use force: true.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked(); // Verify precondition
  await temperatureCheckbox.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked(); // Verify precondition
  await precipitationCheckbox.click({ force: true });

  // Verify layer states
  // Expected: Precipitation is enabled (checked), Temperature is disabled (unchecked)
  await expect(precipitationCheckbox).toBeChecked();
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  // The geocoder panel appears with search results. We wait for the first result item.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // Select the first result. Usually the first list item or a specific button/link.
  // Assuming the first result is a list item or button within the panel.
  const firstResult = geocoderPanel.getByRole('option', { name: /Münster/ }).first();
  // Fallback if 'option' role is not used, try to find the first clickable item matching the name
  if (await firstResult.count() === 0) {
    const firstResultFallback = geocoderPanel.getByText('Münster').first();
    await firstResultFallback.click();
  } else {
    await firstResult.click();
  }

  // Step 5: Wait for the map to navigate to the selected location
  // This is implicit in the next step, but we can wait for the info panel to update.

  // Step 6: Wait for the info panel to load the forecast
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // We count the entries within the weather forecast section.
  // Assuming entries are distinct elements (e.g., list items or cards) inside the section.
  const entries = weatherForecastSection.locator('> *');
  await expect(entries).toHaveCount(24);
});
