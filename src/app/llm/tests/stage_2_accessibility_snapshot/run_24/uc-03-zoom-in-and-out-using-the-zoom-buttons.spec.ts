// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial zoom to settle
  const initialZoom = await page.evaluate(async () => {
    // @ts-ignore - openLayers map instance is typically attached to window in these apps
    // We look for the map instance which usually has a getZoom method
    const map = (window as any).openPioneer?.map?.getMap();
    if (map && typeof map.getView()?.getZoom === 'function') {
      return map.getView().getZoom();
    }
    return undefined;
  });

  // Poll until we have a valid initial zoom value
  await expect.poll(() => page.evaluate(() => {
    const map = (window as any).openPioneer?.map?.getMap();
    return map?.getView()?.getZoom();
  })).toBeDefined();

  const startZoom = await page.evaluate(() => {
    const map = (window as any).openPioneer?.map?.getMap();
    return map?.getView()?.getZoom();
  });

  // Step 1: Click the 'Zoom in' button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Wait for zoom to change and verify it increased
  await expect.poll(() => page.evaluate(() => {
    const map = (window as any).openPioneer?.map?.getMap();
    return map?.getView()?.getZoom();
  })).toBeGreaterThan(startZoom);

  const zoomAfterIn = await page.evaluate(() => {
    const map = (window as any).openPioneer?.map?.getMap();
    return map?.getView()?.getZoom();
  });

  // Step 2: Click the 'Zoom out' button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Wait for zoom to change and verify it decreased compared to the zoomed-in state
  await expect.poll(() => page.evaluate(() => {
    const map = (window as any).openPioneer?.map?.getMap();
    return map?.getView()?.getZoom();
  })).toBeLessThan(zoomAfterIn);
});
