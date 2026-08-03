// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const mapByTestId = page.getByTestId('map');
  const mapContainerByTestId = page.getByTestId('map-container');
  const map = (await mapByTestId.count()) > 0
    ? mapByTestId
    : (await mapContainerByTestId.count()) > 0
      ? mapContainerByTestId
      : page.locator('canvas').first();

  await expect(map).toBeVisible();

  const box = await map.boundingBox();
  if (!box) {
    throw new Error('Map element has no bounding box.');
  }

  await map.click({
    position: {
      x: box.width / 2,
      y: box.height / 2
    }
  });

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
