// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature overlay layer
  const temperatureToggle = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click();
  await expect(temperatureToggle).not.toBeChecked();

  // Step 2: Show Precipitation overlay layer
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click();
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Search for a location
  const searchField = page.getByRole('combobox', { name: /search/i });
  await searchField.fill('Münster');

  // Step 4: Wait for result list and select first result
  const firstResult = page.getByRole('option', { name: 'Münster' }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate (verify map canvas is interactable/visible)
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Step 6: Wait for info panel to load the forecast with 24 entries
  // Assuming the forecast entries have a specific role or test id, or are list items
  // If no specific test id is known, we look for a list or items in the info panel
  const infoPanel = page.getByRole('region', { name: /info/i }).or(page.getByTestId('info-panel'));
  // Fallback to a generic visible panel if specific role/testid isn't guaranteed
  const panelLocator = infoPanel.or(page.locator('[class*="InfoPanel"]'));
  
  // Wait for the forecast section to appear. 
  // Since "24 entries" is the expected result, we might look for a list of 24 items.
  // Without specific test IDs for forecast items, we poll for the presence of forecast-like content.
  // Let's assume forecast items might be list items or have a specific text pattern.
  // A robust way is to wait for the panel to show content that indicates weather data.
  
  // Heuristic: Wait for a significant amount of text or specific UI elements related to weather.
  // If the app renders forecast items in a list, we can count them.
  // Let's assume forecast items are list items within the info panel.
  const forecastItems = panelLocator.locator('li').or(panelLocator.locator('[class*="ForecastItem"]'));
  
  // Poll until we see at least some forecast items, or a specific "24h" or similar indicator.
  // Since we need exactly 24 entries, let's try to count visible items that look like forecast entries.
  // If the structure is a list, `locator('li').count()` might work.
  
  // Alternative: The prompt says "displays a weather forecast section with 24 entries".
  // We can poll for the count of elements that are likely forecast entries.
  // Let's assume they have a common class or role. If not, we might just wait for the panel to update.
  
  // Let's use a generic wait for the info panel to contain text related to "Forecast" or "Weather"
  // and then verify the count of items if possible.
  
  await expect(panelLocator).toContainText('Forecast', { timeout: 10000 });
  
  // Attempt to count forecast items. If they are in a list:
  const itemCount = await panelLocator.locator('li').count();
  expect(itemCount).toBe(24);
});
