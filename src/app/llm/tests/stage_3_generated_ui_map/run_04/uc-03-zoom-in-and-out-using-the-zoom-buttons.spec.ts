// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByTestId('zoom-in-button');
  const zoomOutButton = page.getByTestId('zoom-out-button');

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  let initialZoom: number | undefined;
  await expect.poll(async () => {
    initialZoom = await getMapZoomLevel(page);
    return initialZoom;
  }).not.toBeUndefined();

  await zoomInButton.click();

  let zoomAfterZoomIn: number | undefined;
  await expect.poll(async () => {
    zoomAfterZoomIn = await getMapZoomLevel(page);
    return zoomAfterZoomIn !== undefined && initialZoom !== undefined
      ? zoomAfterZoomIn > initialZoom
      : false;
  }).toBe(true);

  await zoomOutButton.click();

  await expect.poll(async () => {
    const zoomAfterZoomOut = await getMapZoomLevel(page);
    return zoomAfterZoomOut !== undefined && zoomAfterZoomIn !== undefined
      ? zoomAfterZoomOut < zoomAfterZoomIn
      : false;
  }).toBe(true);
});
