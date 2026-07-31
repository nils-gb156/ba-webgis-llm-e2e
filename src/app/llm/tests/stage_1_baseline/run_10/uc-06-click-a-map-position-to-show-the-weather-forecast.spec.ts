// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible before interacting with the map
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the center of the map canvas to trigger a weather forecast lookup
  const mapCanvas = page.locator('canvas');
  await mapCanvas.click({ position: { x: 100, y: 100 } });

  // Wait for the weather forecast section to appear in the info panel
  const weatherForecastSection = page.getByTestId('weather-forecast');
  await expect(weatherForecastSection).toBeVisible();

  // Verify that the forecast contains 24 entries
  const forecastEntries = weatherForecastSection.locator('.forecast-entry');
  await expect(forecastEntries).toHaveCount(24);

  // Verify that the clicked position is highlighted on the map
  // The highlight is typically a marker or circle on the map canvas.
  // Since we can't directly assert canvas content, we look for a specific
  // marker element if available, or rely on the info panel update as a proxy.
  // However, the requirement explicitly states the position is highlighted.
  // Assuming there's a marker test id for the clicked location.
  const clickedPositionMarker = page.getByTestId('clicked-position-marker');
  await expect(clickedPositionMarker).toBeVisible();
});
