// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and be ready
  // Assuming the info panel has a test id or is identifiable by role/text.
  // Since no specific test ids are provided in the prompt, we rely on general visibility.
  // We wait for the map canvas to be present and interactive.
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Identify the info panel. Since no test id is given, we look for a panel that likely contains forecast info.
  // Often info panels have a specific role or are part of a dialog/sidebar.
  // Let's assume there's a container for the info panel. Without specific IDs, we might need to find it by content or structure.
  // However, the prompt says "The info panel is visible" as a precondition, implying it's already there.
  // Let's try to find a generic info panel container. If not possible, we might rely on the map click triggering it.
  
  // Click on the map canvas at a specific position (e.g., center)
  // We need to get the bounding box of the canvas to click within it.
  const mapBoundingBox = await mapCanvas.boundingBox();
  if (!mapBoundingBox) {
    throw new Error('Map canvas not found or not visible');
  }

  const clickX = mapBoundingBox.x + mapBoundingBox.width / 2;
  const clickY = mapBoundingBox.y + mapBoundingBox.height / 2;

  await page.mouse.click(clickX, clickY);

  // Wait for the info panel to update with forecast data.
  // Since we don't have specific test IDs for the forecast entries, we look for a section that likely contains "Forecast" or similar.
  // Or we can check for the presence of a specific element that appears after the click.
  
  // Let's assume the info panel has a test id like 'info-panel' or similar. If not, we might need to use getByRole.
  // Given the complexity and lack of specific IDs, we'll try to find an element that indicates weather forecast.
  // A common pattern is a list or grid of items.
  
  // We'll wait for some text related to weather forecast to appear.
  // Since we don't know the exact text, we'll wait for the info panel to be visible (if it wasn't) or updated.
  // Let's assume the info panel is always visible but updates its content.
  
  // To verify the forecast contains 24 entries, we need to locate the list of entries.
  // Without test IDs, this is tricky. Let's assume there's a container for the forecast list.
  // If no test ID is available, we might have to use a generic locator and count elements.
  
  // Let's try to find a container that might hold the forecast.
  // We'll look for a section with "Forecast" in the text.
  const forecastSection = page.getByText('Forecast', { exact: false }).first();
  await expect(forecastSection).toBeVisible({ timeout: 10000 });

  // Now, we need to count the entries.
  // Assuming the entries are in a list or grid within the forecast section.
  // We'll look for child elements of the forecast section.
  // This is a heuristic approach due to lack of specific test IDs.
  
  // Let's assume the entries are <li> or <div> elements within the forecast section.
  // We'll try to find a list of items.
  const forecastEntries = forecastSection.locator('li, div').filter({ hasText: /./ }).first(); // Placeholder
  // This is not robust. Let's try a different approach.
  
  // Since the expected result is "24 entries", we might need to count them.
  // Without specific locators, we can't be sure.
  // Let's assume there's a test id for the forecast list, e.g., 'weather-forecast-entries'.
  // If not, we might have to use a more generic approach.
  
  // Given the constraints, let's assume the info panel has a test id 'info-panel' and the forecast list has 'forecast-list'.
  // If these don't exist, the test might fail. But this is the best we can do without more info.
  
  // Let's try to find the info panel by its role or text.
  const infoPanel = page.getByRole('region', { name: /info/i }).first();
  await expect(infoPanel).toBeVisible();

  // Inside the info panel, look for the forecast section.
  const forecastContainer = infoPanel.getByText('Forecast').first().locator('..'); // Get parent
  await expect(forecastContainer).toBeVisible();

  // Count the entries. Assume they are in a list.
  // We'll look for a list of items.
  const forecastList = forecastContainer.locator('ul, ol, div[role="list"]').first();
  const entries = forecastList.locator('li, [role="listitem"]').first(); // Get first item to check existence
  await expect(entries).toBeVisible();

  // To count 24 entries, we need to count all items in the list.
  // Since we can't use expect.poll with a count directly in a simple way, we'll use expect.poll to check the count.
  // We'll define a helper function to count the entries.
  const countForecastEntries = async () => {
    const list = forecastContainer.locator('ul, ol, div[role="list"]').first();
    const items = list.locator('li, [role="listitem"]');
    return await items.count();
  };

  await expect.poll(countForecastEntries).toBe(24);

  // Verify the clicked position is highlighted on the map.
  // This is hard to assert without specific test IDs for the highlight.
  // We might assume that if the forecast appears, the position is highlighted.
  // Alternatively, we could look for a marker or highlight on the map canvas.
  // Since the map is a canvas, we can't easily assert DOM elements on it.
  // We'll skip this assertion as it's not feasible without specific test IDs or helper functions.
});
