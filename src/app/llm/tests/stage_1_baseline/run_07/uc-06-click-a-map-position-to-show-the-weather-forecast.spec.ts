// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the info panel to be visible as per preconditions
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Locate the map container to click on it
  const mapContainer = page.getByTestId('map');
  await expect(mapContainer).toBeVisible();

  // Click on the center of the map canvas
  const mapBox = await mapContainer.boundingBox();
  if (mapBox) {
    await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
  }

  // Wait for the weather forecast section to appear in the info panel
  const weatherForecastSection = infoPanel.getByTestId('weather-forecast');
  await expect(weatherForecastSection).toBeVisible();

  // Verify the clicked position is highlighted on the map.
  // We look for a feature marker or highlight element within the map container.
  // Assuming there is a specific test id for the highlight or marker, or we check for a generic marker.
  // If no specific test id exists for the highlight, we might check for a specific class or role if available.
  // Given the complexity, let's assume there's a marker or highlight element.
  // Often, highlights might have a specific test id like 'map-highlight' or similar.
  // Let's try to find a marker or highlight element.
  const highlight = page.getByTestId('map-highlight').or(page.getByRole('img', { name: /marker/i }));
  // Since 'or' is not a locator method, we'll check for either.
  // A more robust way if no specific ID is known is to check for any element that indicates a click.
  // However, per instructions, we prefer test ids. Let's assume 'map-highlight' exists.
  await expect(page.getByTestId('map-highlight')).toBeVisible();

  // Verify the forecast contains 24 entries
  // Assuming each forecast entry has a test id like 'forecast-entry' or is a list item
  const forecastEntries = infoPanel.getByTestId('forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
