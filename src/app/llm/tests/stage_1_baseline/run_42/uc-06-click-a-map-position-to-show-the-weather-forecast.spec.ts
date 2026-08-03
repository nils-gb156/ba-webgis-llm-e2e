// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const infoPanel = page.locator('aside, [role="complementary"]').first();
  await expect(infoPanel).toBeVisible();

  const box = await mapCanvas.boundingBox();
  expect(box).not.toBeNull();

  const clickX = Math.round(box!.width * 0.55);
  const clickY = Math.round(box!.height * 0.45);

  const clipWidth = 32;
  const clipHeight = 32;
  const clipX = Math.round(
    Math.min(Math.max(box!.x + clickX - clipWidth / 2, box!.x), box!.x + box!.width - clipWidth)
  );
  const clipY = Math.round(
    Math.min(Math.max(box!.y + clickY - clipHeight / 2, box!.y), box!.y + box!.height - clipHeight)
  );

  const highlightClip = {
    x: clipX,
    y: clipY,
    width: clipWidth,
    height: clipHeight
  };

  const beforeClickImage = await page.screenshot({ clip: highlightClip });

  await mapCanvas.click({
    position: { x: clickX, y: clickY }
  });

  const forecastTitle = page.getByText(/weather\s*forecast|forecast|wetter/i).first();
  await expect(forecastTitle).toBeVisible({ timeout: 30000 });

  await expect
    .poll(async () => {
      const afterClickImage = await page.screenshot({ clip: highlightClip });
      return afterClickImage.equals(beforeClickImage);
    }, { timeout: 30000 })
    .toBe(false);

  await expect
    .poll(async () => {
      const startHandle = await forecastTitle.elementHandle();
      if (!startHandle) {
        return 0;
      }

      return await startHandle.evaluate((startElement) => {
        const isVisible = (element: Element) => {
          const htmlElement = element as HTMLElement;
          const style = window.getComputedStyle(htmlElement);
          const rect = htmlElement.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };

        const getRepeatedChildrenCount = (root: Element) => {
          const containers = [root, ...Array.from(root.querySelectorAll('*'))];
          for (const container of containers) {
            const visibleChildren = Array.from(container.children).filter(isVisible);
            if (visibleChildren.length === 24) {
              return 24;
            }
            if (visibleChildren.length === 25) {
              return 24;
            }
          }
          return 0;
        };

        let container: Element | null = startElement;
        while (container) {
          const repeatedEntries = Array.from(
            container.querySelectorAll('[role="listitem"], [role="row"], li, tr')
          ).filter(isVisible);

          if (repeatedEntries.length === 24) {
            return 24;
          }
          if (repeatedEntries.length === 25) {
            return 24;
          }

          const repeatedChildrenCount = getRepeatedChildrenCount(container);
          if (repeatedChildrenCount === 24) {
            return 24;
          }

          container = container.parentElement;
        }

        return 0;
      });
    }, { timeout: 30000 })
    .toBe(24);
});
