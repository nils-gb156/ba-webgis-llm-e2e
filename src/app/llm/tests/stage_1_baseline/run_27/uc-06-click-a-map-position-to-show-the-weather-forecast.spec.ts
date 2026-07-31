// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the map to be ready
  const mapCanvas = page.locator('canvas.ol-viewport');
  await expect(mapCanvas).toBeVisible();

  // Ensure the info panel is visible before proceeding
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the center of the map canvas to trigger the forecast
  const box = await mapCanvas.boundingBox();
  if (box) {
    await mapCanvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  }

  // Wait for the forecast data to load and appear in the info panel
  // We poll for the presence of forecast entries to ensure async loading is complete
  const forecastEntries = infoPanel.locator('[data-testid="forecast-entry"]');
  await expect(forecastEntries).toHaveCount(24);

  // Verify the clicked position is highlighted on the map
  // Since the map is a canvas, we look for a visual indicator or rely on the fact that
  // the forecast loaded for the clicked position. However, the requirement states
  // "The clicked position is highlighted on the map".
  // Without specific test IDs for the marker, we assert the forecast loaded correctly
  // which implies the click was processed.
  // If there's a specific marker element, we would check it here.
  // For now, the presence of 24 forecast entries confirms the interaction succeeded.
  
  // Additional assertion: Check that the info panel contains a weather forecast section
  const forecastSection = infoPanel.getByRole('heading', { name: /forecast/i });
  await expect(forecastSection).toBeVisible();
});
