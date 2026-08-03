// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  const infoPanel = page.getByRole('complementary').or(page.locator('aside')).first();
  await expect(infoPanel).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const forecastRequestUrls: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (/weather|forecast|open-meteo/i.test(url)) {
      forecastRequestUrls.push(url);
    }
  });

  await mapCanvas.click({
    position: { x: 220, y: 160 }
  });

  await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(0);
  await expect.poll(() => forecastRequestUrls[forecastRequestUrls.length - 1] ?? '').toMatch(
    /weather|forecast|open-meteo/i
  );

  const weatherForecastSection = infoPanel
    .getByRole('heading', { name: /weather forecast/i })
    .or(infoPanel.getByText(/weather forecast/i))
    .first();
  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => {
    const namedRegion = infoPanel.getByRole('region', { name: /weather forecast/i });
    if ((await namedRegion.count()) > 0) {
      const listItems = await namedRegion.getByRole('listitem').count();
      const articles = await namedRegion.getByRole('article').count();
      const rows = await namedRegion.getByRole('row').count();
      return Math.max(listItems, articles, rows > 24 ? rows - 1 : rows);
    }

    const namedGroup = infoPanel.getByRole('group', { name: /weather forecast/i });
    if ((await namedGroup.count()) > 0) {
      const listItems = await namedGroup.getByRole('listitem').count();
      const articles = await namedGroup.getByRole('article').count();
      const rows = await namedGroup.getByRole('row').count();
      return Math.max(listItems, articles, rows > 24 ? rows - 1 : rows);
    }

    const listItems = await infoPanel.getByRole('listitem').count();
    const articles = await infoPanel.getByRole('article').count();
    const rows = await infoPanel.getByRole('row').count();
    return Math.max(listItems, articles, rows > 24 ? rows - 1 : rows);
  }).toBe(24);
});
