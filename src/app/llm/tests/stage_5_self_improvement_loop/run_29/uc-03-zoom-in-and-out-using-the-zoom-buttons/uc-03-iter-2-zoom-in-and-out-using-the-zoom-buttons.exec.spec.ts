// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready (zoom level becomes defined)
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Capture the initial zoom level before any interaction
  const initialZoom = await getMapZoomLevel(page);
  expect(initialZoom).toBeDefined();

  // Step 1: Click the 'Zoom in' button to increase the zoom level
  await page.getByTestId('zoom-in-button').click();

  // Verify that the zoom level is higher after clicking 'Zoom in'
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom!);

  // Step 2: Click the 'Zoom out' button to decrease the zoom level
  await page.getByTestId('zoom-out-button').click();

  // Verify that the zoom level is lower after clicking 'Zoom out' compared to after zooming in
  await expect.poll(() => getMapZoomLevel(page)).toBeLessThan(initialZoom!);
});
