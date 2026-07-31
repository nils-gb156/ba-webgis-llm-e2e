// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map container to be visible to ensure the map is initialized
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Get the initial zoom level using the helper function
  const getZoomLevel = (page: any) => {
    // @ts-ignore: Helper function injected by the test environment
    return window.__pioneerMapHelpers?.getZoomLevel?.();
  };

  const initialZoom = await expect.poll(() => getZoomLevel(page)).toBeDefined();

  // Step 1: Click the 'Zoom in' button to increase the zoom level
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Assert that the zoom level is higher after clicking zoom in
  const zoomAfterIn = await expect.poll(() => getZoomLevel(page)).toBeDefined();
  expect(zoomAfterIn).toBeGreaterThan(initialZoom);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Assert that the zoom level is lower after clicking zoom out
  const zoomAfterOut = await expect.poll(() => getZoomLevel(page)).toBeDefined();
  expect(zoomAfterOut).toBeLessThan(zoomAfterIn);
});
