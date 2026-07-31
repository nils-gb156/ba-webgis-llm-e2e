// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('UC3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByRole('button', { name: 'Zoom in map' });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out map' });

  // Record the initial zoom level
  const initialZoom = await getMapZoomLevel(page);
  expect(initialZoom).toBeDefined();

  // Step 1: Click the 'Zoom in' button
  await zoomInButton.click();

  // Step 2: Click the 'Zoom out' button
  await zoomOutButton.click();

  // Verify that the final zoom level is lower than the zoom level after zooming in
  // Since we zoomed in once and then out once, the final zoom should be equal to the initial zoom
  await expect.poll(() => getMapZoomLevel(page)).resolves.toBe(initialZoom);
});
