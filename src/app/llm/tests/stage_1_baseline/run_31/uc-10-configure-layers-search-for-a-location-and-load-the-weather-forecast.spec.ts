// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  // Ensure it is currently checked before clicking to hide it
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  // Ensure it is currently unchecked before clicking to show it
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Step 3: Search for a location
  const searchField = page.getByRole('searchbox', { name: /search/i });
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  // The results usually appear in a list or dropdown associated with the search
  const firstResult = page.getByRole('option', { name: 'Münster', exact: false }).first();
  // Wait for at least one result to be visible
  await expect(firstResult).toBeVisible({ timeout: 10000 });
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // Since we don't have map helpers, we assert on the info panel loading content
  // which implies the map has centered on the location.
  // We wait for the info panel to update its content significantly.

  // Step 6: Wait for the info panel to load the forecast
  // The expected result is a weather forecast section with 24 entries.
  // We look for a container that likely holds the forecast items.
  // Assuming the forecast items have a consistent role or structure.
  // Often forecast items might be list items or divs with specific classes.
  // Let's try to find the forecast section first.
  
  // The info panel is likely a dialog or a specific region.
  // Let's assume the forecast entries are distinct elements.
  // We will poll for the count of forecast entries.
  
  // Heuristic: Look for elements that might represent forecast hours/days.
  // Without specific test IDs, we rely on the structure appearing.
  // Let's assume the forecast list is inside the info panel.
  
  // We need to identify the forecast entries. 
  // If the app renders a list of 24 items, they might share a common selector or role.
  // Let's try to find elements that appear after the search.
  
  // Alternative: The info panel might show a specific header or text.
  // Let's wait for the info panel to contain text related to forecast or temperature/precipitation.
  
  // More robust approach: Wait for the info panel to update.
  // The prompt says "info panel displays a weather forecast section with 24 entries".
  // Let's assume the entries are rendered as distinct DOM nodes.
  
  // We will poll for the presence of at least one forecast entry, and then check the count.
  // However, Playwright's expect.poll can check the count of elements.
  
  // Let's try to find the forecast container.
  // If no specific test ID, we might look for a list.
  
  // Since exact structure isn't known, we'll wait for the info panel to show content
  // and then verify the count of forecast items if possible.
  // Often, forecast items might be `div` or `li` with some text.
  
  // Let's assume the forecast items have a role or can be identified by text pattern.
  // Or we can just wait for the info panel to be visible and contain "Forecast" or similar.
  
  // Let's try to find elements with the text "Forecast" or similar in the info panel.
  const infoPanel = page.getByRole('region', { name: /info/i }).or(page.getByRole('dialog', { name: /info/i })).or(page.locator('[data-testid="info-panel"]'));
  
  // If the above is too ambiguous, let's just wait for the search result to be processed
  // which usually triggers the info panel update.
  
  // Let's wait for the first result to be selected (map navigation)
  // We can check if the search field loses focus or the result list disappears.
  await expect(firstResult).not.toBeVisible({ timeout: 10000 }); // Result list disappears after selection

  // Now wait for the forecast entries to appear.
  // We'll assume the forecast entries are rendered in the info panel.
  // Let's try to find elements that might be forecast entries.
  // If they don't have a test id, we might look for a list.
  
  // Let's assume the forecast is a list of items.
  // We will poll for the count of these items.
  // Without a specific selector for forecast items, this is tricky.
  // However, the prompt implies we should assert 24 entries.
  
  // Let's assume the forecast items have a common class or role.
  // If not, we might have to rely on the info panel being updated.
  
  // Let's try to find the forecast section by text.
  const forecastSection = page.getByText(/forecast/i, { exact: false }).first();
  await expect(forecastSection).toBeVisible({ timeout: 15000 });
  
  // Now, find the entries within the forecast section.
  // If the entries are list items, they might have a role.
  // Let's assume they are divs or li elements.
  // We'll try to count elements that are children of the forecast section.
  
  // This part is speculative without knowing the exact DOM structure.
  // However, we can try to find elements that appear after the forecast header.
  
  // Let's assume the forecast entries are distinct elements with some text.
  // We'll try to find all elements that are likely forecast entries.
  // If they have a test id, use it. If not, use a generic selector.
  
  // Let's assume the forecast entries are in a list.
  const forecastEntries = forecastSection.locator('li, div').filter({ hasText: /temperature|precipitation|hour|day/i });
  
  // Wait for at least one entry to appear
  await expect(forecastEntries.first()).toBeVisible({ timeout: 10000 });
  
  // Poll for the count of forecast entries to be 24
  await expect.poll(async () => {
    const count = await forecastEntries.count();
    return count;
  }).toBe(24, { timeout: 15000 });

  // Verify the layer states
  // Precipitation should be checked (enabled)
  await expect(precipitationToggle).toBeChecked();
  // Temperature should be unchecked (disabled/hidden)
  await expect(temperatureToggle).not.toBeChecked();
});
