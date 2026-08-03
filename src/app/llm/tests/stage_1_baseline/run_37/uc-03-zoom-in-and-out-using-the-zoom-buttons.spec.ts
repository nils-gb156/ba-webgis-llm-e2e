// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });
  const mapLayers = page.locator('.ol-layers');

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();
  await expect(mapLayers).toBeVisible();

  const getMapLayersSignature = async () => {
    const screenshot = await mapLayers.screenshot({ animations: 'disabled' });
    return screenshot.toString('base64');
  };

  const initialMapSignature = await getMapLayersSignature();

  await zoomInButton.click();

  await expect.poll(async () => {
    return await getMapLayersSignature();
  }).not.toBe(initialMapSignature);

  await zoomOutButton.click();

  await expect.poll(async () => {
    return await getMapLayersSignature();
  }).toBe(initialMapSignature);
});
