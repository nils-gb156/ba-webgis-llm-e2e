// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByRole('main')).toBeVisible();

  const infoPanel = page.getByRole('complementary').first();
  await expect(infoPanel).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas has no bounding box.');
  }

  await mapCanvas.click({
    position: {
      x: Math.max(10, Math.floor(box.width * 0.4)),
      y: Math.max(10, Math.floor(box.height * 0.4))
    }
  });

  const forecastHeading = infoPanel.getByRole('heading', { name: /weather forecast/i });
  await expect(forecastHeading).toBeVisible();

  await expect.poll(async () => {
    return await forecastHeading.evaluate((heading) => {
      const countEntries = (root: Element) => {
        const listItems = root.querySelectorAll('[role="listitem"], li').length;
        if (listItems === 24) {
          return 24;
        }

        const tableRows = root.querySelectorAll('tbody tr').length;
        if (tableRows === 24) {
          return 24;
        }

        const roleRows = root.querySelectorAll('[role="row"]').length;
        const headerRows = root.querySelectorAll('[role="rowheader"], thead tr').length;
        if (roleRows - headerRows === 24) {
          return 24;
        }

        const forecastTestIds = root.querySelectorAll('[data-testid*="forecast"]').length;
        if (forecastTestIds === 24) {
          return 24;
        }

        const timeLabels = new Set(
          Array.from(root.querySelectorAll('*'))
            .map((el) => (el.textContent ?? '').trim())
            .filter((text) => /^\d{1,2}:\d{2}$/.test(text))
        ).size;
        if (timeLabels === 24) {
          return 24;
        }

        return Math.max(listItems, tableRows, Math.max(0, roleRows - headerRows), forecastTestIds, timeLabels);
      };

      let current: Element | null = heading.parentElement;
      let bestCount = 0;

      while (current) {
        const count = countEntries(current);
        if (count === 24) {
          return 24;
        }
        bestCount = Math.max(bestCount, count);
        current = current.parentElement;
      }

      return bestCount;
    });
  }).toBe(24);
});
