// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  await page.waitForLoadState('networkidle');
  await expect(page.locator('canvas')).toBeVisible();

  // Helper to read current zoom level from the map canvas context
  const getZoomLevel = async (page: any) => {
    const view = await page.evaluate(() => {
      // OpenLayers map instance is typically attached to the window or accessible via the first canvas's parent
      const canvas = document.querySelector('canvas');
      if (!canvas) return undefined;
      // OpenLayers stores the map instance on the canvas element or its parent
      // Common pattern: canvas.ownerDocument.defaultView.openPioneer?.map or similar
      // However, a robust way is to look for the OL map object if exposed, or query the view state
      // Since we don't have explicit helpers, we rely on the fact that OL maps are often accessible
      // via a global or by traversing the DOM if the app exposes it.
      // Let's assume the app exposes the map instance or we can get the view from the canvas.
      // A common way in OL is to attach the map to the window for debugging or testing.
      // If not, we might need to use a different strategy.
      // Let's try to find the map instance. In many OL apps, it's `window.map` or similar.
      // If not available, we might have to rely on visual cues or specific test IDs if available.
      // Given the prompt says "Map state ... is NOT represented as DOM elements", we need a way to read it.
      // Without explicit helpers provided in the prompt, we must assume there's a way to access it.
      // Let's assume the application exposes the OpenLayers map instance on the window object for testing purposes,
      // or we can access it via the canvas element's parent if the app attaches it there.
      // A safer bet without specific helpers is to check if there's a global `openPioneer` or similar.
      const map = (window as any).openPioneer?.map;
      if (map) {
        return map.getView().getZoom();
      }
      return undefined;
    });
    return view;
  };

  // Get initial zoom level
  const initialZoom = await expect.poll(() => getZoomLevel(page)).toBeDefined();
  expect(initialZoom).toBeDefined();

  // Step 1: Click the 'Zoom in' button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom level to change
  const zoomAfterIn = await expect.poll(() => getZoomLevel(page)).toBeGreaterThan(initialZoom as number);

  // Step 2: Click the 'Zoom out' button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom level to decrease
  const zoomAfterOut = await expect.poll(() => getZoomLevel(page)).toBeLessThan(zoomAfterIn as number);
});
