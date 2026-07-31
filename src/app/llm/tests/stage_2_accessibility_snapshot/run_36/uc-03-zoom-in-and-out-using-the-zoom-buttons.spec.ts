// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Helper to get current zoom level via the map helper
  const getZoom = async (page: any) => {
    // Assuming map helpers are available globally or via a specific module.
    // Since no helper module was provided in the prompt, we rely on the scale viewer
    // or map container interaction. However, zoom level is not directly in DOM.
    // We will use the scale viewer text as a proxy for zoom changes, or click the map
    // and check coordinates if needed. But zoom buttons change zoom directly.
    // Let's try to infer zoom from the scale viewer text "Current scale: 1 to X".
    // Higher zoom = smaller scale denominator.
    const scaleText = await page.getByRole('region', { name: 'Scale' }).textContent();
    if (!scaleText) return null;
    const match = scaleText.match(/1 to (\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  };

  // Get initial zoom level (scale denominator)
  const initialScaleDenom = await getZoom(page);
  expect(initialScaleDenom).toBeTruthy();

  // Step 1: Click 'Zoom in' button to increase zoom level (decrease scale denominator)
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom change to settle
  await page.waitForTimeout(500); // Small wait for map animation/update

  // Assert zoom level is higher (scale denominator is lower)
  const zoomedInScaleDenom = await getZoom(page);
  expect(zoomedInScaleDenom).toBeLessThan(initialScaleDenom!);

  // Step 2: Click 'Zoom out' button to decrease zoom level (increase scale denominator)
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom change to settle
  await page.waitForTimeout(500);

  // Assert zoom level is lower (scale denominator is higher) than after zooming in
  const zoomedOutScaleDenom = await getZoom(page);
  expect(zoomedOutScaleDenom).toBeGreaterThan(zoomedInScaleDenom!);
});
