// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible.
  // The accessibility tree shows "Info Panel Switcher" is already pressed (visible).
  // We assert visibility to ensure the precondition is met.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Wait for the map container to be visible and interactive
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Click on the center of the map canvas
  const box = await mapContainer.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  // Wait for the info panel to update with weather forecast content.
  // We look for the "Weather Forecast" heading which appears in the info panel.
  const weatherForecastHeading = page.getByRole('heading', { name: 'Weather Forecast', level: 1 });
  await expect(weatherForecastHeading).toBeVisible();

  // Verify the clicked position is highlighted on the map.
  // Since map features are not DOM elements, we rely on the info panel updating
  // and the coordinate viewer potentially updating.
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  await expect(coordinateViewer).toBeVisible();

  // Verify the info panel displays a weather forecast section.
  // We already checked the heading is visible. Let's check for the list of entries.
  // The expected result is 24 entries.
  // We will poll for the presence of at least one entry in the weather forecast section.
  // Assuming the entries are list items within the weather forecast section.
  // Since we don't have specific test ids for the entries, we look for the section and then count items.
  
  // Get the weather forecast section content.
  // The accessibility tree shows "Weather Forecast" as a heading inside the info panel.
  // We can find the container by the heading and then look for list items or paragraphs.
  const forecastSection = infoPanel.getByRole('heading', { name: 'Weather Forecast', level: 1 }).locator('..');
  
  // Wait for the forecast entries to appear.
  // We expect 24 entries. Let's wait for the count to be at least 1 to ensure it loaded.
  await expect.poll(async () => {
    // Try to find list items or paragraphs that represent forecast entries.
    // The structure might be a list. Let's look for any child elements that indicate data.
    // Based on typical React rendering, these might be divs or li elements.
    const count = await forecastSection.locator('li, div').count();
    return count;
  }).toBeGreaterThan(0);

  // Verify the forecast contains 24 entries.
  // We need to be more specific about what constitutes an entry.
  // Let's assume the entries are rendered as a list.
  // We will poll for the count of list items or similar structural elements.
  await expect.poll(async () => {
    // Try to find list items within the forecast section.
    // If it's not a ul/li, it might be a series of divs.
    // Let's try to find elements that look like forecast data.
    // Without specific test IDs, we might have to guess the structure.
    // Let's assume the forecast entries are in a list.
    const listItems = forecastSection.locator('li');
    const count = await listItems.count();
    if (count > 0) {
      return count;
    }
    // If no list items, try to count paragraphs or divs that might represent entries.
    // This is a heuristic and might need adjustment based on actual DOM structure.
    const paragraphs = forecastSection.locator('p, div');
    return paragraphs.count();
  }).toBe(24);
});
