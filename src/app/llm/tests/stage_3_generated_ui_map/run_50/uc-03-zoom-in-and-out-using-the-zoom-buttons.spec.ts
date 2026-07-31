// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and get initial zoom
  const initialZoom = await expect.poll(() => getMapZoomLevel(page)).toBeTruthy();

  // Step 1: Click zoom in
  await page.getByTestId('zoom-in-button').click();
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);

  // Step 2: Click zoom out
  await page.getByTestId('zoom-out-button').click();
  const finalZoom = await expect.poll(() => getMapZoomLevel(page));
  expect(finalZoom).toBeLessThan(initialZoom);
});
