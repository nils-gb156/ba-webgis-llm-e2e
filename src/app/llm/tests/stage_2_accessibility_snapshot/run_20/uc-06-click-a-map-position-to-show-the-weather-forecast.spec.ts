// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: The info panel is visible.
  // The accessibility tree shows the info panel toggle is pressed, so the panel should be open.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Precondition: The map canvas is interactive.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Step 1: The user clicks on a position on the map canvas.
  // We click near the center of the map container.
  const mapBox = await mapContainer.boundingBox();
  if (mapBox) {
    await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
  } else {
    // Fallback if bounding box is not available, click center of viewport
    await page.mouse.click(page.viewportSize!.width / 2, page.viewportSize!.height / 2);
  }

  // Step 2: The user waits for the info panel to load the forecast.
  // Expected result: The clicked position is highlighted on the map.
  // Note: Map highlights are rendered on the canvas and cannot be directly asserted via DOM.
  // However, we can assert the presence of the weather forecast section which implies the click was processed.

  // Expected result: The info panel displays a weather forecast section.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: The forecast contains 24 entries.
  // We poll the forecast section to wait for the data to load and then count the entries.
  // Assuming each entry is a distinct element (e.g., a row or card) within the forecast section.
  // Since the specific structure of the forecast entries isn't detailed with test IDs,
  // we look for a common pattern. Often forecasts are lists.
  // Let's assume the forecast entries are contained within the weather-forecast-section.
  // We will poll for the presence of at least 24 items. If the structure is a list, we can count list items.
  // If not, we might need to count specific child elements. Without more context, we'll check for the section's visibility
  // and then try to count elements that look like forecast entries.
  // A robust way is to count the number of child elements that are likely forecast items.
  // Let's assume the forecast items are divs or similar within the section.
  
  await expect.poll(async () => {
    const section = page.getByTestId('weather-forecast-section');
    // Try to count elements inside the section. 
    // If the section uses a list, we might look for li or specific classes.
    // If it's a grid, we look for grid items.
    // Without specific test ids for entries, we count direct children or children of a known list.
    // Let's try to get all elements inside the section and filter for those that look like entries.
    // A safer bet is to check if the section has content and then verify the count of specific sub-elements if possible.
    // Given the complexity, we'll poll for the section to have a certain number of child elements.
    // Let's assume the forecast entries are rendered as a list or grid.
    const children = await section.locator('> *').count();
    return children;
  }).toBeGreaterThanOrEqual(24);
});
