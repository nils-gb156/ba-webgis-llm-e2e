// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and get initial zoom level
  const initialZoom = await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Step 1: Click the 'Zoom in' button to increase the zoom level
  const zoomInButton = page.getByRole('button', { name: 'Zoom in' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Verify zoom level is higher after clicking zoom in
  const zoomAfterIn = await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  expect(zoomAfterIn).toBeGreaterThan(initialZoom);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Verify zoom level is lower after clicking zoom out compared to after zoom in
  const zoomAfterOut = await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  expect(zoomAfterOut).toBeLessThan(zoomAfterIn);
});
