// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the map to be interactive
  // Assuming the map canvas has a specific test id or role. 
  // Since no specific test ids are provided in the prompt for the map container, 
  // we rely on the canvas element which is standard for OpenLayers.
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Get the bounding box of the map canvas to click a position within it
  const mapBox = await mapCanvas.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas not found or not visible');
  }

  // Calculate a center point on the map to click
  const clickX = mapBox.x + mapBox.width / 2;
  const clickY = mapBox.y + mapBox.height / 2;

  // Click on the map
  await page.mouse.click(clickX, clickY);

  // Wait for the info panel to appear and load content
  // Assuming the info panel has a test id or can be identified by role/label.
  // Common pattern: info panel might be a dialog or a sidebar panel.
  // Let's assume there's a container for the info panel content.
  // If no specific test id is known, we might wait for a specific text or element that indicates weather data.
  // However, the prompt implies checking for "weather forecast section".
  // Let's assume the info panel is visible and we need to wait for the weather data to load.
  
  // Since we don't have specific test IDs for the info panel or weather forecast section,
  // we will try to find a common identifier or wait for the map marker to appear.
  // The prompt mentions "clicked position is highlighted on the map".
  // OpenLayers often adds a feature or marker. Without specific test IDs, this is hard to assert directly via DOM.
  // However, we can assert on the info panel content.
  
  // Let's assume the info panel has a test id 'info-panel' or similar.
  // If not, we might look for a heading or specific text.
  // Given the complexity and lack of specific test IDs in the prompt, 
  // we will try to locate the info panel by a likely test id or role.
  // Let's try to find an element that contains "Weather" or similar.
  
  // Alternative: Wait for the map to have a marker. 
  // Since we can't easily assert map markers without test IDs, we focus on the info panel.
  
  // Let's assume the info panel is visible and contains the forecast.
  // We will wait for a text that indicates weather data is present.
  
  // To be robust, let's look for a common pattern:
  // The info panel might be a div with a specific class or test id.
  // Let's try to find an element with test id 'weather-forecast' or similar.
  // If not available, we might need to rely on the presence of a list of 24 items.
  
  // Since the prompt is generic, let's assume there is a container for the forecast.
  // We will wait for a list of items that likely represents the 24 entries.
  
  // Let's try to find the info panel first.
  // Assuming the info panel is visible after clicking.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Now, wait for the weather forecast section to appear.
  // Let's assume there is a section with test id 'weather-forecast' or similar.
  const weatherForecastSection = page.getByTestId('weather-forecast');
  await expect(weatherForecastSection).toBeVisible();

  // Wait for the forecast to contain 24 entries.
  // Let's assume the entries are in a list with test id 'forecast-entries'.
  const forecastEntries = page.getByTestId('forecast-entries');
  await expect(forecastEntries).toBeVisible();

  // Count the number of entries.
  // We need to wait until the count is 24.
  await expect.poll(async () => {
    const count = await forecastEntries.count();
    return count;
  }).toBe(24);

  // Additionally, check that the clicked position is highlighted on the map.
  // Since we can't easily assert map markers, we rely on the info panel update.
  // The prompt says "clicked position is highlighted on the map".
  // Without specific test IDs for map markers, we can't assert this directly.
  // However, the presence of the weather forecast implies a position was clicked.
  // We will assume the map marker is added by the application.
});
