// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map container to be visible before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Get the initial zoom level
  const initialZoom = await page.evaluate(() => {
    // @ts-ignore - OpenLayers map is available on window
    return window.__openPioneerMap?.getZoom();
  });

  // Step 1: Click the 'Zoom in' button to increase the zoom level.
  await page.getByRole('button', { name: 'Zoom in map' }).click();

  // Wait for the zoom level to change and assert it is higher
  await expect.poll(() => page.evaluate(() => {
    // @ts-ignore
    return window.__openPioneerMap?.getZoom();
  })).toBeGreaterThan(initialZoom);

  // Get the zoom level after zooming in
  const zoomedInZoom = await page.evaluate(() => {
    // @ts-ignore
    return window.__openPioneerMap?.getZoom();
  });

  // Step 2: Click the 'Zoom out' button to decrease the zoom level.
  await page.getByRole('button', { name: 'Zoom out map' }).click();

  // Wait for the zoom level to change and assert it is lower than after zooming in
  await expect.poll(() => page.evaluate(() => {
    // @ts-ignore
    return window.__openPioneerMap?.getZoom();
  })).toBeLessThan(zoomedInZoom);
});
