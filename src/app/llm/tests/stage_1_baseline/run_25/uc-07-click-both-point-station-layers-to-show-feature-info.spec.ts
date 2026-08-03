// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  const box = await mapViewport.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map viewport has no bounding box.');
  }

  const pixelFromCoordinate = await page.evaluate(([x, y]) => {
    for (const candidate of Object.values(window as unknown as Record<string, unknown>)) {
      const value = candidate as {
        getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
      } | null;

      try {
        const pixel = value?.getPixelFromCoordinate?.([x, y]);
        if (
          Array.isArray(pixel) &&
          pixel.length === 2 &&
          Number.isFinite(pixel[0]) &&
          Number.isFinite(pixel[1])
        ) {
          return {
            x: Math.round(pixel[0]),
            y: Math.round(pixel[1])
          };
        }
      } catch {
        // Ignore non-map globals.
      }
    }

    return null;
  }, [1188692.84, 6767643.28] as const);

  const clickPosition =
    pixelFromCoordinate &&
    pixelFromCoordinate.x >= 0 &&
    pixelFromCoordinate.y >= 0 &&
    pixelFromCoordinate.x <= box.width &&
    pixelFromCoordinate.y <= box.height
      ? pixelFromCoordinate
      : {
          x: Math.round(box.width / 2),
          y: Math.round(box.height / 2)
        };

  await mapViewport.click({ position: clickPosition });

  await expect(page.getByText(/^UV-Index Station$/)).toBeVisible();
  await expect(page.getByText(/^EUCOS Ground Station$/)).toBeVisible();
});
