// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready and initial zoom is captured
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Helper to read current zoom level via the scale viewer text
  const getZoomLevel = async () => {
    const scaleViewer = page.getByTestId('scale-viewer');
    const text = await scaleViewer.textContent();
    // Extract the scale denominator from text like "Current scale: 1 to 2739072"
    const match = text?.match(/1 to (\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return undefined;
  };

  // Wait for initial state to settle
  const initialZoom = await expect.poll(() => getZoomLevel()).toBeDefined();

  // Step 1: Click the 'Zoom in' button to increase the zoom level
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom to change and verify it is higher (scale denominator decreases as zoom increases)
  const zoomedInScale = await expect.poll(() => getZoomLevel()).toBeDefined();
  expect(zoomedInScale).toBeLessThan(initialZoom);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom to change and verify it is lower (scale denominator increases as zoom decreases)
  const zoomedOutScale = await expect.poll(() => getZoomLevel()).toBeDefined();
  expect(zoomedOutScale).toBeGreaterThan(zoomedInScale);
});
