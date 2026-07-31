// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to load and be ready
  await page.waitForLoadState('networkidle');

  // Identify the map canvas element for clicking
  // Assuming the map canvas has a test id or is the main interactive element
  // If no specific test id is known, we look for the canvas or a container
  const mapContainer = page.locator('canvas').first();
  
  // Ensure the map container is visible before interacting
  await expect(mapContainer).toBeVisible();

  // Get the bounding box of the map to calculate a click position within it
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas not found or not visible');
  }

  // Calculate a click position in the center of the map
  const clickX = mapBox.x + mapBox.width / 2;
  const clickY = mapBox.y + mapBox.height / 2;

  // Click on the map
  await page.mouse.click(clickX, clickY);

  // Wait for the info panel to load the forecast
  // Assuming the info panel has a test id or is identifiable by role/text
  // Let's assume there's a specific section or element that shows the forecast
  // If no test id is provided, we might look for a header or specific text
  
  // Since we don't have specific test ids, we'll wait for some network activity or DOM change
  // indicative of the forecast loading. 
  // Often, forecast data might appear in a list or specific container.
  // Let's assume the info panel is visible and we wait for a specific forecast element.
  
  // Strategy: Wait for a response that might indicate forecast data loading
  // Or wait for a specific element to appear.
  // Without specific test ids, we might poll for the presence of forecast entries.
  
  // Let's assume there is an element with a test id for the forecast list, e.g., 'forecast-list'
  // If not, we might look for a specific structure.
  // Since the prompt mentions "info panel displays a weather forecast section", let's try to find it.
  
  // Attempt 1: Look for a common test id if it exists in the app (hypothetical)
  // const forecastList = page.getByTestId('forecast-list');
  // await expect(forecastList).toBeVisible();

  // Attempt 2: Since we don't know the exact test ids, we'll wait for the map marker to appear
  // and then poll for the forecast content.
  
  // Wait for a marker to appear on the map (assuming a specific class or test id for markers)
  // If markers have a test id, use it. Otherwise, we might check for a change in the map state.
  // Let's assume markers have a test id 'map-marker'
  const marker = page.locator('[data-testid="map-marker"]').first();
  await expect(marker).toBeVisible();

  // Now, poll for the forecast entries to appear in the info panel
  // Assuming the forecast entries are in a list with a specific structure
  // Let's assume the info panel has a test id 'info-panel' and the forecast is inside it
  // We'll look for a list of items that represent the 24 entries.
  
  // Hypothetical: Forecast entries have a test id 'forecast-entry'
  const forecastEntries = page.locator('[data-testid="forecast-entry"]');
  
  // Wait until there are 24 forecast entries
  await expect.poll(async () => {
    return await forecastEntries.count();
  }).toBe(24);

  // Verify the info panel is visible (precondition, but good to double-check)
  const infoPanel = page.locator('[data-testid="info-panel"]');
  await expect(infoPanel).toBeVisible();
});
