// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const canvasCount = await page.locator('canvas').count();
  expect(canvasCount).toBeGreaterThan(0);

  const largestCanvasIndex = await page.locator('canvas').evaluateAll((elements) => {
    let maxArea = -1;
    let maxIndex = -1;

    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const isVisible =
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none';

      if (isVisible) {
        const area = rect.width * rect.height;
        if (area > maxArea) {
          maxArea = area;
          maxIndex = index;
        }
      }
    });

    return maxIndex;
  });

  expect(largestCanvasIndex).toBeGreaterThanOrEqual(0);

  const mapCanvas = page.locator('canvas').nth(largestCanvasIndex);
  await expect(mapCanvas).toBeVisible();

  const boundingBox = await mapCanvas.boundingBox();
  expect(boundingBox).not.toBeNull();
  if (!boundingBox) {
    throw new Error('Map canvas has no bounding box.');
  }

  await mapCanvas.click({
    position: {
      x: boundingBox.width / 2,
      y: boundingBox.height / 2,
    },
  });

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
