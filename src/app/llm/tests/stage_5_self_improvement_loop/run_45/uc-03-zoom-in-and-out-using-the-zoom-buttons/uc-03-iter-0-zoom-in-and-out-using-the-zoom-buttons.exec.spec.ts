// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('zoom-in-button')).toBeVisible();
  await expect(page.getByTestId('zoom-out-button')).toBeVisible();

  let initialZoom: number | undefined;
  await expect.poll(async () => {
    initialZoom = await getMapZoomLevel(page);
    return typeof initialZoom === 'number';
  }).toBe(true);

  await page.getByTestId('zoom-in-button').click();

  let zoomAfterIn: number | undefined;
  await expect.poll(async () => {
    zoomAfterIn = await getMapZoomLevel(page);
    return zoomAfterIn;
  }).toBeGreaterThan(initialZoom!);

  await page.getByTestId('zoom-out-button').click();

  await expect.poll(async () => getMapZoomLevel(page)).toBeLessThan(zoomAfterIn!);
});
