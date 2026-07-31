// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map container to be visible to ensure the map is ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Helper to get current zoom level via the scale viewer text
  const getZoomLevel = async (p: typeof page) => {
    const scaleText = await p.getByTestId('scale-viewer').textContent();
    // Scale format is "Current scale: 1 to <value>".
    // Higher zoom = smaller scale denominator.
    // We'll parse the denominator to compare relative zoom levels.
    if (!scaleText) return 0;
    const match = scaleText.match(/1 to (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Get initial zoom level
  const initialZoomDenominator = await getZoomLevel(page);

  // Step 1: Click the 'Zoom in' button to increase the zoom level.
  // Zooming in decreases the scale denominator.
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for the map to settle and zoom level to change
  await expect.poll(async () => getZoomLevel(page)).toBeLessThan(initialZoomDenominator);

  const zoomedInDenominator = await getZoomLevel(page);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level.
  // Zooming out increases the scale denominator.
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for the map to settle and zoom level to change back
  await expect.poll(async () => getZoomLevel(page)).toBeGreaterThan(zoomedInDenominator);
});
