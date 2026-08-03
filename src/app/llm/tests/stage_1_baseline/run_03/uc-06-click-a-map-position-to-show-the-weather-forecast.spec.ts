// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  let infoPanel = page.locator('body');
  const complementaryPanels = page.getByRole('complementary');
  if ((await complementaryPanels.count()) > 0) {
    infoPanel = complementaryPanels.first();
    await expect(infoPanel).toBeVisible();
  } else {
    const asidePanels = page.locator('aside');
    if ((await asidePanels.count()) > 0) {
      infoPanel = asidePanels.first();
      await expect(infoPanel).toBeVisible();
    }
  }

  const box = await mapCanvas.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map canvas has no bounding box.');
  }

  const beforeClickMapImage = await mapCanvas.screenshot();

  await mapCanvas.click({
    position: {
      x: Math.floor(box.width * 0.55),
      y: Math.floor(box.height * 0.45)
    }
  });

  const forecastPattern = /weather forecast|wettervorhersage/i;

  await expect(page.getByText(forecastPattern).first()).toBeVisible();

  const complementaryWithForecast = page.getByRole('complementary').filter({ hasText: forecastPattern });
  if ((await complementaryWithForecast.count()) > 0) {
    infoPanel = complementaryWithForecast.first();
  } else {
    const regionWithForecast = page.getByRole('region').filter({ hasText: forecastPattern });
    if ((await regionWithForecast.count()) > 0) {
      infoPanel = regionWithForecast.first();
    } else {
      const groupWithForecast = page.getByRole('group').filter({ hasText: forecastPattern });
      if ((await groupWithForecast.count()) > 0) {
        infoPanel = groupWithForecast.first();
      }
    }
  }

  await expect(infoPanel.getByText(forecastPattern).first()).toBeVisible();

  await expect
    .poll(async () => {
      const afterClickMapImage = await mapCanvas.screenshot();
      return afterClickMapImage.equals(beforeClickMapImage);
    })
    .toBe(false);

  const countForecastEntries = async (container: any) => {
    let maxCount = 0;

    const tableLikeRoles: ('table' | 'grid')[] = ['table', 'grid'];
    for (const role of tableLikeRoles) {
      const widgets = container.getByRole(role);
      const widgetCount = await widgets.count();
      for (let i = 0; i < widgetCount; i++) {
        const widget = widgets.nth(i);
        if (!(await widget.isVisible())) {
          continue;
        }

        const rows = await widget.getByRole('row').count();
        if (rows === 24 || rows === 25) {
          return 24;
        }
        maxCount = Math.max(maxCount, rows);
      }
    }

    const lists = container.getByRole('list');
    const listCount = await lists.count();
    for (let i = 0; i < listCount; i++) {
      const list = lists.nth(i);
      if (!(await list.isVisible())) {
        continue;
      }

      const items = await list.getByRole('listitem').count();
      if (items === 24) {
        return 24;
      }
      maxCount = Math.max(maxCount, items);
    }

    const listItems = await container.getByRole('listitem').count();
    if (listItems === 24) {
      return 24;
    }
    maxCount = Math.max(maxCount, listItems);

    const articles = await container.getByRole('article').count();
    if (articles === 24) {
      return 24;
    }
    maxCount = Math.max(maxCount, articles);

    const panelText = await container.innerText().catch(() => '');
    const timeMatches = panelText.match(/\b(?:[01]\d|2[0-3])(?::00| Uhr)\b/g) ?? [];
    const uniqueTimes = Array.from(new Set(timeMatches.map((match: string) => match.trim())));
    if (uniqueTimes.length === 24) {
      return 24;
    }
    maxCount = Math.max(maxCount, uniqueTimes.length);

    return maxCount;
  };

  await expect.poll(async () => countForecastEntries(infoPanel)).toBe(24);
});
