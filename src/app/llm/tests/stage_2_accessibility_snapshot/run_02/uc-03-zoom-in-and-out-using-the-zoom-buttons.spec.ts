// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the initial extent to be loaded
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Helper to get current zoom level via the scale viewer text
  const getZoomLevel = async (p) => {
    const scaleText = await p.getByTestId('scale-viewer').textContent();
    // Scale format is "1 to X". We can infer relative zoom from scale denominator.
    // Lower denominator = higher zoom.
    if (!scaleText) return undefined;
    const match = scaleText.match(/1 to (\d+)/);
    if (!match) return undefined;
    return parseInt(match[1], 10);
  };

  // Wait for initial scale to be set
  await expect.poll(() => getZoomLevel(page)).toBeDefined();
  const initialScale = await getZoomLevel(page);
  test.assert(initialScale !== undefined, 'Initial scale should be defined');

  // Step 1: Click 'Zoom in' button
  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  await zoomInButton.click();

  // Wait for zoom change by checking scale denominator decreases (higher zoom)
  await expect.poll(async () => {
    const scale = await getZoomLevel(page);
    return scale !== undefined && scale < initialScale;
  }).toBeTruthy();

  const zoomedInScale = await getZoomLevel(page);

  // Step 2: Click 'Zoom out' button
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });
  await zoomOutButton.click();

  // Wait for zoom change by checking scale denominator increases (lower zoom)
  // It should be higher than the zoomed-in scale.
  await expect.poll(async () => {
    const scale = await getZoomLevel(page);
    return scale !== undefined && scale > zoomedInScale;
  }).toBeTruthy();
});
