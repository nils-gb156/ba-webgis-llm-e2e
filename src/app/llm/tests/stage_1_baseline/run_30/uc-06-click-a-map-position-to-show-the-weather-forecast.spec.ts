// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  let infoPanel = page.getByRole('complementary').first();
  if ((await infoPanel.count()) === 0) {
    infoPanel = page.locator('aside').first();
  }
  await expect(infoPanel).toBeVisible();

  const beforeClickMapImage = await mapCanvas.screenshot();

  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas is not rendered.');
  }

  await mapCanvas.click({
    position: {
      x: Math.round(box.width * 0.6),
      y: Math.round(box.height * 0.4)
    }
  });

  let forecastTitle = infoPanel.getByRole('heading', {
    name: /weather forecast|forecast|wettervorhersage|vorhersage/i
  }).first();

  if ((await forecastTitle.count()) === 0) {
    forecastTitle = infoPanel.getByText(/weather forecast|forecast|wettervorhersage|vorhersage/i).first();
  }

  await expect(forecastTitle).toBeVisible();

  await expect.poll(async () => {
    return await infoPanel.evaluate((panel) => {
      const titlePattern = /weather forecast|forecast|wettervorhersage|vorhersage/i;

      const countEntries = (root: Element): number => {
        const roleListItems = root.querySelectorAll('[role="listitem"]').length;
        const listItems = root.querySelectorAll('li').length;
        const tbodyRows = root.querySelectorAll('tbody tr').length;
        const tableRows = root.querySelectorAll('table tr').length;
        const theadRows = root.querySelectorAll('thead tr').length;
        const dataRows = tableRows > 0 ? Math.max(0, tableRows - theadRows) : 0;
        const roleRows = root.querySelectorAll('[role="row"]').length;
        const roleColumnHeaders = root.querySelectorAll('[role="columnheader"]').length;
        const roleDataRows = roleRows > 0 ? Math.max(0, roleRows - (roleColumnHeaders > 0 ? 1 : 0)) : 0;

        return Math.max(roleListItems, listItems, tbodyRows, dataRows, roleDataRows);
      };

      let bestCount = countEntries(panel);

      const titledElements = Array.from(panel.querySelectorAll('*')).filter((element) =>
        titlePattern.test(element.textContent ?? '')
      );

      for (const element of titledElements) {
        let current: Element | null = element;
        while (current && current !== panel) {
          bestCount = Math.max(bestCount, countEntries(current));
          current = current.parentElement;
        }
      }

      return bestCount;
    });
  }).toBe(24);

  const afterClickMapImage = await mapCanvas.screenshot();
  expect(afterClickMapImage.equals(beforeClickMapImage)).toBe(false);
});
