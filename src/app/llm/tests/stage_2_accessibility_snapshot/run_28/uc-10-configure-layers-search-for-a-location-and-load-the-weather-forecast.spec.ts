// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to be ready and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('geocoder-input')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer
  // The Temperature checkbox is initially checked. We need to uncheck it.
  // Since it's a Chakra UI checkbox, we use force: true.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer
  // The Precipitation checkbox is initially unchecked. We need to check it.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3 & 4: Search for 'Münster' and select the first result
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Wait for the geocoder panel (result list) to appear
  await expect(page.getByTestId('geocoder-panel')).toBeVisible();

  // Select the first result from the geocoder panel
  // Assuming the first result is the first list item or button inside the panel.
  // Based on typical geocoder UI, the results are often in a list.
  const firstResult = page.getByTestId('geocoder-panel').getByRole('option').first();
  // Fallback if 'option' role is not used, try clicking the first visible text item in the panel
  const fallbackFirstResult = page.getByTestId('geocoder-panel').locator('li').first();
  
  // Try to click the first result. If the structure is different, we might need to adjust.
  // Given the context, let's assume the results are interactive elements within the panel.
  // We'll try to find a clickable element that represents the first search result.
  // Often these are buttons or list items.
  const resultItem = page.getByTestId('geocoder-panel').getByRole('button').first();
  
  // If no buttons are found, try list items
  const fallbackResultItem = page.getByTestId('geocoder-panel').locator('li').first();
  
  // Attempt to click the first result. We'll use a more generic approach if specific roles fail.
  // Let's assume the first result is a list item that is clickable.
  await fallbackResultItem.click();

  // Step 5: Wait for the map to navigate to the selected location
  // Since we don't have map helpers, we wait for the info panel to update, which implies navigation.
  // Or we can wait for the scale bar to change, indicating a new view.
  // However, the most direct indicator is the info panel loading new data.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast with 24 entries
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  // We need to find the weather forecast section and count the entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Count the number of forecast entries.
  // Assuming each entry is a list item or a distinct element within the weather forecast section.
  // We'll poll for the number of entries to reach 24.
  await expect.poll(async () => {
    const entries = await weatherForecastSection.locator('li').count();
    return entries;
  }).toBe(24);
});
