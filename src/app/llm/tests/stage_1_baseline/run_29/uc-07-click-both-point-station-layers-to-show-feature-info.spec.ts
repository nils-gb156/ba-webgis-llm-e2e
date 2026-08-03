// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const box = await mapCanvas.boundingBox();
  expect(box).not.toBeNull();

  const getFeatureInfoResponse = page.waitForResponse((response) =>
    /GetFeatureInfo/i.test(response.url())
  );

  await mapCanvas.click({
    position: {
      x: box!.width / 2,
      y: box!.height / 2
    }
  });

  await expect(await getFeatureInfoResponse).toHaveProperty('status', 200);

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
