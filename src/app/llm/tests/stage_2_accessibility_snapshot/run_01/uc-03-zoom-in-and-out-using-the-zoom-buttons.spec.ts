// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready and get initial zoom level
  const getZoomLevel = async (p: typeof page) => {
    // @ts-expect-error - helper function injected by test harness
    const result = await p.evaluate(() => (window as any).__getMapZoomLevel?.());
    return result;
  };

  const initialZoom = await expect.poll(() => getZoomLevel(page)).toBeDefined();

  // Step 1: Click 'Zoom in' button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await zoomInButton.click();

  // Wait for zoom level to increase
  const zoomedInLevel = await expect.poll(() => getZoomLevel(page)).toBeGreaterThan(initialZoom);

  // Step 2: Click 'Zoom out' button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await zoomOutButton.click();

  // Wait for zoom level to decrease compared to the zoomed-in state
  const finalZoomLevel = await expect.poll(() => getZoomLevel(page)).toBeLessThan(zoomedInLevel);
});
