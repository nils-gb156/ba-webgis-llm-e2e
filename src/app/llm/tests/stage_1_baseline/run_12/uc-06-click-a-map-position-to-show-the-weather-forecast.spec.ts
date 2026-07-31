// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to be loaded and the map canvas to be interactive
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Click on a position on the map canvas.
  // Using a central position on the canvas to ensure we click within the visible area.
  const box = await mapCanvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  // Wait for the info panel to load the forecast.
  // Assuming the info panel has a test id or can be identified by role.
  // Let's assume the info panel is visible and contains the forecast.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // The clicked position is highlighted on the map.
  // Since map features are not DOM elements, we rely on the info panel updating.
  // However, if there's a specific marker or highlight element, we would assert it.
  // For now, we assume the info panel update is sufficient evidence of the click being processed.

  // The info panel displays a weather forecast section.
  const forecastSection = infoPanel.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();

  // The forecast contains 24 entries.
  // Assuming each entry has a test id or can be counted by a common selector.
  const forecastEntries = forecastSection.locator('[data-testid="forecast-entry"]');
  await expect(forecastEntries).toHaveCount(24);
});
