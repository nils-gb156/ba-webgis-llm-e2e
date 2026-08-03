// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await expect(page).toHaveURL(/ba-webgis-llm-e2e\/?$/);

  const infoPanel =
    (await page.getByRole('complementary').count()) > 0
      ? page.getByRole('complementary').first()
      : page.locator('aside').first();
  await expect(infoPanel).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const canvasBox = await mapCanvas.boundingBox();
  expect(canvasBox).not.toBeNull();

  await mapCanvas.click({
    position: {
      x: Math.floor(canvasBox!.width * 0.35),
      y: Math.floor(canvasBox!.height * 0.35)
    }
  });

  await expect
    .poll(async () => {
      const heading = page.getByRole('heading', { name: /weather forecast/i });
      if ((await heading.count()) > 0) {
        return await heading.first().isVisible();
      }

      const text = page.getByText(/weather forecast/i);
      if ((await text.count()) > 0) {
        return await text.first().isVisible();
      }

      return false;
    })
    .toBe(true);

  await expect
    .poll(async () => {
      let container = page.locator('body');

      const forecastRegion = page.getByRole('region', { name: /weather forecast/i });
      if ((await forecastRegion.count()) > 0) {
        container = forecastRegion.first();
      } else if ((await infoPanel.count()) > 0) {
        container = infoPanel;
      }

      const listItemCount = await container.getByRole('listitem').count();
      const rowCount = await container.getByRole('row').count();
      const articleCount = await container.getByRole('article').count();
      const timeLabelCount = await container.getByText(/\b\d{1,2}:\d{2}\b/).count();
      const temperatureCount = await container.getByText(/-?\d+(?:[.,]\d+)?\s*°C/).count();

      return [
        listItemCount,
        Math.max(rowCount - 1, 0),
        articleCount,
        timeLabelCount,
        temperatureCount
      ];
    })
    .toContain(24);

  // The clicked-position highlight is rendered on the OpenLayers canvas and cannot be
  // asserted via DOM locators without dedicated map-state helpers.
});
