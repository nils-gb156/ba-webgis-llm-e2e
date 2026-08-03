// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const uvIndexStationsCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  if ((await uvIndexStationsCheckbox.count()) > 0) {
    if (!(await uvIndexStationsCheckbox.isChecked())) {
      await uvIndexStationsCheckbox.click({ force: true });
    }
    await expect(uvIndexStationsCheckbox).toBeChecked();
  }

  const eucosGroundStationsCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  if ((await eucosGroundStationsCheckbox.count()) > 0) {
    if (!(await eucosGroundStationsCheckbox.isChecked())) {
      await eucosGroundStationsCheckbox.click({ force: true });
    }
    await expect(eucosGroundStationsCheckbox).toBeChecked();
  }

  const canvasBox = await mapCanvas.boundingBox();
  expect(canvasBox).not.toBeNull();
  if (!canvasBox) {
    throw new Error('Map canvas has no bounding box.');
  }

  await mapCanvas.click({
    position: {
      x: Math.round(canvasBox.width / 2),
      y: Math.round(canvasBox.height / 2)
    }
  });

  await expect(page.getByText('UV-Index Station', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true }).first()).toBeVisible();
});
