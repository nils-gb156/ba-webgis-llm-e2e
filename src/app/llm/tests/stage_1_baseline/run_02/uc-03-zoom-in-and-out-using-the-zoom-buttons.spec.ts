// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const zoomInButton = page.getByTitle('Zoom in', { exact: true });
  const zoomOutButton = page.getByTitle('Zoom out', { exact: true });
  const mapCanvas = page.locator('canvas').first();

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(mapCanvas).toBeVisible();

  const waitForStableCanvas = async (): Promise<Buffer> => {
    let previous = await mapCanvas.screenshot();

    await expect.poll(async () => {
      const current = await mapCanvas.screenshot();
      const isStable = Buffer.compare(current, previous) === 0;
      previous = current;
      return isStable;
    }).toBe(true);

    return previous;
  };

  const waitForCanvasChange = async (reference: Buffer): Promise<Buffer> => {
    await expect.poll(async () => {
      const current = await mapCanvas.screenshot();
      return Buffer.compare(current, reference) !== 0;
    }).toBe(true);

    return await waitForStableCanvas();
  };

  const initialCanvas = await waitForStableCanvas();

  await zoomInButton.click();
  const zoomedInCanvas = await waitForCanvasChange(initialCanvas);
  await expect
    .poll(async () => Buffer.compare(zoomedInCanvas, initialCanvas) !== 0)
    .toBe(true);

  await zoomOutButton.click();
  const zoomedOutCanvas = await waitForCanvasChange(zoomedInCanvas);
  await expect
    .poll(async () => Buffer.compare(zoomedOutCanvas, zoomedInCanvas) !== 0)
    .toBe(true);
});
