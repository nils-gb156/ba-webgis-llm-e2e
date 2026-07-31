// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map container to be visible before interacting with zoom controls
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Retrieve initial zoom level via helper
  const getMapZoom = async (p: typeof page) => {
    const helpers = await import('../helpers/mapHelpers.ts');
    return helpers.getMapZoom(p);
  };

  const initialZoomPoll = await expect.poll(() => getMapZoom(page));
  expect(initialZoomPoll).toBeDefined();
  const initialZoom = initialZoomPoll as number;

  // Step 1: Click 'Zoom in' button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in' });
  await expect(zoomInButton).toBeVisible();
  await zoomInButton.click();

  // Verify zoom level increased
  const zoomInPoll = await expect.poll(() => getMapZoom(page));
  expect(zoomInPoll).toBeGreaterThan(initialZoom);

  // Step 2: Click 'Zoom out' button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out' });
  await expect(zoomOutButton).toBeVisible();
  await zoomOutButton.click();

  // Verify zoom level decreased compared to the zoomed-in state
  const zoomOutPoll = await expect.poll(() => getMapZoom(page));
  expect(zoomOutPoll).toBeLessThan(zoomInPoll as number);
});
