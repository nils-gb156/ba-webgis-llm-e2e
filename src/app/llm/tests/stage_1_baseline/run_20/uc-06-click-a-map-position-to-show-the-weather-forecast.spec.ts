// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map canvas to be visible and interactive
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Click on the center of the map canvas to trigger the weather forecast
  const box = await mapCanvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  // Wait for the info panel to load the forecast.
  // Assuming the info panel has a test id or can be identified by role/content.
  // We'll look for a section that likely contains the forecast.
  // Since no specific test ids are provided in the prompt for the forecast entries,
  // we will wait for the info panel to appear and then check for the forecast content.
  // Let's assume the info panel is identified by a test id 'info-panel' or similar.
  // If not, we might need to rely on the presence of the forecast data.

  // Let's assume there's a container for the forecast.
  // We'll wait for some element that indicates the forecast is loaded.
  // Since the expected result mentions "24 entries", we can look for a list or grid.
  // Without specific test ids, we'll try to find a reasonable locator.
  // Let's assume the forecast is in a div with a class or test id.
  // We'll wait for the info panel to be visible first.

  // Let's assume the info panel is visible by default or becomes visible after interaction.
  // We'll wait for the map to show a highlight (e.g., a marker or circle).
  // Since map content is on a canvas, we can't directly assert DOM elements on the map.
  // However, the app might update some state or DOM element to reflect the selected point.
  // Let's assume there's a test id for the selected point indicator or the forecast container.

  // Since the prompt doesn't provide specific test ids, we'll make reasonable assumptions
  // based on common patterns. Let's assume:
  // - The info panel has a test id 'info-panel'
  // - The forecast section has a test id 'weather-forecast'
  // - Each forecast entry has a test id 'forecast-entry'

  // Wait for the info panel to be visible
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Wait for the weather forecast section to be visible
  const forecastSection = page.getByTestId('weather-forecast');
  await expect(forecastSection).toBeVisible();

  // Wait for the forecast to contain 24 entries
  // We'll count the number of forecast entry elements
  const forecastEntries = page.getByTestId('forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
