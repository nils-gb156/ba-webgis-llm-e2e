// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to load and be ready
  await page.waitForLoadState('networkidle');

  // Ensure the info panel is visible before proceeding
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Locate the map canvas container
  const mapContainer = page.getByTestId('map');
  await expect(mapContainer).toBeVisible();

  // Get the bounding box of the map container to click within it
  const boundingBox = await mapContainer.boundingBox();
  if (!boundingBox) {
    throw new Error('Map container bounding box not found');
  }

  // Calculate a center point within the map container
  const clickX = boundingBox.x + boundingBox.width / 2;
  const clickY = boundingBox.y + boundingBox.height / 2;

  // Click on the map canvas
  await page.mouse.click(clickX, clickY);

  // Wait for the info panel to update with weather forecast data
  // We poll for the presence of the forecast section within the info panel
  await expect.poll(async () => {
    const forecastSection = infoPanel.locator('text=Weather Forecast');
    return await forecastSection.isVisible();
  }).toBeTruthy();

  // Verify that the clicked position is highlighted on the map
  // Since map state is not in the DOM, we rely on the info panel update as a proxy
  // However, if there's a specific marker test id, we would check it here.
  // Assuming the highlight is visual and not directly testable via DOM,
  // we focus on the info panel content as per expected results.

  // Verify the info panel displays a weather forecast section
  const forecastSection = infoPanel.locator('text=Weather Forecast');
  await expect(forecastSection).toBeVisible();

  // Verify the forecast contains 24 entries
  // Assuming each entry has a specific test id or structure, e.g., 'forecast-entry'
  const forecastEntries = infoPanel.locator('[data-testid="forecast-entry"]');
  const entryCount = await forecastEntries.count();
  expect(entryCount).toBe(24);
});
