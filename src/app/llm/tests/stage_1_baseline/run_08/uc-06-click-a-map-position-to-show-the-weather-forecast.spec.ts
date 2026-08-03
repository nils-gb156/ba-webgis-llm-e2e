// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  let infoPanel = page.getByTestId('info-panel');
  if ((await infoPanel.count()) === 0) {
    infoPanel = page.getByRole('complementary').first();
  }
  await expect(infoPanel).toBeVisible();

  let map = page.getByTestId('map');
  if ((await map.count()) === 0) {
    map = page.locator('canvas').first();
  }
  await expect(map).toBeVisible();

  await map.click({ position: { x: 260, y: 180 } });

  const weatherForecastHeading = infoPanel.getByRole('heading', { name: /weather forecast/i });
  await expect(weatherForecastHeading).toBeVisible();

  await expect(infoPanel.getByRole('listitem')).toHaveCount(24);
});
