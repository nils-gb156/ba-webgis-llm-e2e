// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByTitle('Zoom in');
  const zoomOutButton = page.getByTitle('Zoom out');
  const mapCanvas = page.locator('canvas').first();

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(mapCanvas).toBeVisible();

  const waitForStableMapImage = async (): Promise<void> => {
    await expect
      .poll(async () => {
        const first = (await mapCanvas.screenshot()).toString('base64');
        const second = (await mapCanvas.screenshot()).toString('base64');
        return first === second;
      })
      .toBe(true);
  };

  await page.waitForLoadState('networkidle');
  await waitForStableMapImage();

  const initialMapImage = (await mapCanvas.screenshot()).toString('base64');

  await zoomInButton.click();

  await expect
    .poll(async () => {
      const currentMapImage = (await mapCanvas.screenshot()).toString('base64');
      return currentMapImage !== initialMapImage;
    })
    .toBe(true);

  await page.waitForLoadState('networkidle');
  await waitForStableMapImage();

  const zoomedInMapImage = (await mapCanvas.screenshot()).toString('base64');
  expect(zoomedInMapImage).not.toBe(initialMapImage);

  await zoomOutButton.click();

  await expect
    .poll(async () => {
      const currentMapImage = (await mapCanvas.screenshot()).toString('base64');
      return currentMapImage !== zoomedInMapImage;
    })
    .toBe(true);

  await page.waitForLoadState('networkidle');
  await waitForStableMapImage();

  const zoomedOutMapImage = (await mapCanvas.screenshot()).toString('base64');
  expect(zoomedOutMapImage).not.toBe(zoomedInMapImage);
});
