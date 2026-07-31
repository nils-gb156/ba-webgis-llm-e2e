// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to be ready
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('search-field')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-toggle-temperature');
  await expect(temperatureToggle).toBeChecked(); // Initially visible/checked
  await temperatureToggle.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = page.getByTestId('layer-toggle-precipitation');
  await expect(precipitationToggle).not.toBeChecked(); // Initially hidden/unchecked
  await precipitationToggle.click({ force: true });

  // Verify layer states
  await expect(temperatureToggle).not.toBeChecked(); // Temperature should now be hidden
  await expect(precipitationToggle).toBeChecked(); // Precipitation should now be visible

  // Step 3: Search for a location
  const searchField = page.getByTestId('search-field');
  await searchField.fill('Münster');

  // Step 4: Wait for result list and select first result
  const searchResults = page.getByTestId('search-results');
  await expect(searchResults).toBeVisible();
  const firstResult = searchResults.getByRole('option').first();
  await firstResult.click();

  // Step 5: Wait for map to navigate
  // Since we don't have map helpers, we wait for the info panel to start updating or for a network request
  // We assume the navigation triggers a request or a state change reflected in the UI
  await page.waitForLoadState('networkidle');
  
  // Step 6: Wait for info panel to load the forecast with 24 entries
  // The info panel should display a weather forecast section
  const infoPanel = page.getByTestId('info-panel');
  
  // We poll for the forecast entries to appear. Assuming each entry has a test id or role.
  // If specific test ids aren't known, we look for a list of forecast items.
  // Let's assume the forecast items are rendered as a list with a specific test id or role.
  // Common pattern: a list of cards or list items.
  
  // Polling for the number of forecast entries to be 24
  await expect.poll(async () => {
    // Try to find forecast entries. If they have a specific test id like 'forecast-entry', use that.
    // Otherwise, try to count elements that look like forecast items.
    // Let's assume a generic structure if specific IDs aren't provided in the prompt's context.
    // However, the prompt implies standard ARIA. Let's look for a list.
    const forecastList = infoPanel.getByRole('list', { name: /forecast/i });
    if (!forecastList) return 0;
    return forecastList.locator('li').count();
  }).toBe(24);
});
