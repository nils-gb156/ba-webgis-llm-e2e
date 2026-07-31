// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to load and be ready
  await page.waitForLoadState('networkidle');

  // Locate the map canvas container to click on it.
  // Based on typical Open Pioneer Trails structure, the map container often has a test id or role.
  // Assuming a common test id for the map container if available, otherwise fallback to role.
  // Since no specific test ids were provided in the prompt for the map container, we use a robust locator.
  // Often, the map canvas itself is a <canvas> element. We can locate the container div.
  // Let's assume the map container has a test-id or is identifiable by its role/aria-label if exposed.
  // If not, we might need to use a CSS selector for the map container.
  // However, the instructions say to prefer getByTestId. Let's assume a standard test id for the map.
  // If no test id is known, we might need to inspect the page. But without inspection, we must guess or use a generic approach.
  // Let's assume the map container has a test id like 'map-container' or similar.
  // If we can't find a test id, we might use getByRole('application') or similar if the app is an SPA.
  // But for map interaction, we need the canvas.
  // Let's try to find the canvas element.
  const mapCanvas = page.locator('canvas').first();
  
  // Wait for the map canvas to be visible
  await expect(mapCanvas).toBeVisible();

  // Click on the center of the map canvas
  // We need to get the bounding box of the canvas to click in the middle
  const box = await mapCanvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    // Fallback if bounding box is not available
    await mapCanvas.click();
  }

  // Wait for the info panel to update with weather forecast
  // The info panel likely has a test id or can be identified by its content.
  // Let's assume the info panel has a test id like 'info-panel' or 'weather-info'.
  // If not, we might look for a specific element that appears after the click.
  // Let's assume there's a container for the weather forecast.
  // We'll wait for some element that indicates the forecast is loaded.
  // Since the expected result mentions "24 entries", we might look for a list or grid.
  // Let's assume the info panel is visible and has a test id.
  const infoPanel = page.getByTestId('info-panel').or(page.getByRole('region', { name: 'Info Panel' })).first();
  
  // Wait for the info panel to be visible
  await expect(infoPanel).toBeVisible();

  // Wait for the weather forecast section to appear
  // Assuming there's a specific section for weather forecast with a test id or role
  const weatherForecastSection = page.getByTestId('weather-forecast').or(page.getByRole('region', { name: 'Weather Forecast' })).first();
  
  // Wait for the weather forecast section to be visible
  await expect(weatherForecastSection).toBeVisible();

  // Wait for the forecast to contain 24 entries
  // Assuming each entry has a test id or role, e.g., 'forecast-entry' or 'time-slot'
  const forecastEntries = page.getByTestId('forecast-entry').or(page.getByRole('listitem', { name: /Forecast/ })).all();
  
  // Use expect.poll to wait for the number of entries to be 24
  await expect.poll(async () => {
    const count = await forecastEntries.length;
    return count;
  }).toBe(24);

  // Verify that the clicked position is highlighted on the map
  // This might be represented by a marker or a specific class on the canvas
  // Since we can't directly assert on canvas content, we might look for a marker element
  // Assuming there's a marker with a test id or role
  const marker = page.getByTestId('map-marker').or(page.getByRole('img', { name: 'Marker' })).first();
  
  // Wait for the marker to be visible
  await expect(marker).toBeVisible();
});
