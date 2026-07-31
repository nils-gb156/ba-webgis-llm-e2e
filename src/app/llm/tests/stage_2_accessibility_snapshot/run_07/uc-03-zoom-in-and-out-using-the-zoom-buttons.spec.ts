// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is loaded and interactive
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Helper to get current zoom level via the scale viewer
  // The scale viewer shows "Current scale: 1 to X". A smaller X means higher zoom.
  // We parse the denominator to determine relative zoom.
  const getZoomDenominator = async (page: any) => {
    const scaleText = await page.getByTestId('scale-viewer').textContent();
    // Expected format: "Current scale: 1 to 2739072"
    const match = scaleText?.match(/1 to (\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 0;
  };

  // Get initial zoom level
  const initialDenominator = await getZoomDenominator(page);

  // Step 1: Click the 'Zoom in' button to increase the zoom level.
  // A higher zoom level means a smaller scale denominator.
  await page.getByRole('button', { name: 'Zoom in map' }).click();

  // Wait for zoom to settle and verify zoom level increased (denominator decreased)
  await expect.poll(async () => getZoomDenominator(page)).toBeLessThan(initialDenominator);

  // Get the zoom level after zooming in
  const zoomedInDenominator = await getZoomDenominator(page);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level.
  await page.getByRole('button', { name: 'Zoom out map' }).click();

  // Wait for zoom to settle and verify zoom level decreased (denominator increased)
  // It should be larger than the denominator after zooming in.
  await expect.poll(async () => getZoomDenominator(page)).toBeGreaterThan(zoomedInDenominator);
});
