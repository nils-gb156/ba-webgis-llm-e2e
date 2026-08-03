// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByTitle('Zoom in', { exact: true });
  const zoomOutButton = page.getByTitle('Zoom out', { exact: true });
  const mapViewport = page.locator('.ol-viewport').first();

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(mapViewport).toBeVisible();

  await page.waitForLoadState('networkidle');

  const initialViewportImage = await mapViewport.screenshot();

  await zoomInButton.click();

  await expect.poll(async () => {
    const currentViewportImage = await mapViewport.screenshot();
    return currentViewportImage.equals(initialViewportImage);
  }).toBe(false);

  const zoomedInViewportImage = await mapViewport.screenshot();
  expect(zoomedInViewportImage.equals(initialViewportImage)).toBeFalsy();

  await zoomOutButton.click();

  await expect.poll(async () => {
    const currentViewportImage = await mapViewport.screenshot();
    return currentViewportImage.equals(zoomedInViewportImage);
  }).toBe(false);

  await expect.poll(async () => {
    const currentViewportImage = await mapViewport.screenshot();
    return currentViewportImage.equals(initialViewportImage);
  }).toBe(true);
});
