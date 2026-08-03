// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await expect(page).toHaveURL('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  const mapPixel = await page.evaluate((coordinate) => {
    const isObject = (value: unknown): value is object =>
      (typeof value === 'object' && value !== null) || typeof value === 'function';

    const seen = new WeakSet<object>();
    const queue: unknown[] = [];

    const enqueue = (value: unknown) => {
      if (isObject(value) && !seen.has(value)) {
        queue.push(value);
      }
    };

    enqueue(window);

    for (const element of Array.from(document.querySelectorAll('*'))) {
      enqueue(element);

      for (const key of Object.getOwnPropertyNames(element)) {
        if (key.startsWith('__reactFiber$') || key.startsWith('__reactProps$')) {
          try {
            enqueue((element as Record<string, unknown>)[key]);
          } catch {
            // ignore unreadable properties
          }
        }
      }
    }

    let processed = 0;
    while (queue.length > 0 && processed < 15000) {
      processed += 1;
      const current = queue.shift();

      if (!isObject(current) || seen.has(current)) {
        continue;
      }
      seen.add(current);

      try {
        const candidate = current as {
          getPixelFromCoordinate?: (coordinate: number[]) => unknown;
          getViewport?: () => unknown;
        };

        if (
          typeof candidate.getPixelFromCoordinate === 'function' &&
          typeof candidate.getViewport === 'function'
        ) {
          const pixel = candidate.getPixelFromCoordinate(coordinate);
          const viewport = candidate.getViewport();

          if (
            Array.isArray(pixel) &&
            pixel.length === 2 &&
            typeof pixel[0] === 'number' &&
            typeof pixel[1] === 'number' &&
            viewport instanceof HTMLElement
          ) {
            const rect = viewport.getBoundingClientRect();

            if (
              pixel[0] >= 0 &&
              pixel[1] >= 0 &&
              pixel[0] <= rect.width &&
              pixel[1] <= rect.height
            ) {
              return { x: pixel[0], y: pixel[1] };
            }
          }
        }
      } catch {
        // ignore non-map objects
      }

      let propertyNames: string[] = [];
      try {
        propertyNames = Object.getOwnPropertyNames(current).slice(0, 50);
      } catch {
        propertyNames = [];
      }

      for (const propertyName of propertyNames) {
        try {
          enqueue((current as Record<string, unknown>)[propertyName]);
        } catch {
          // ignore unreadable properties
        }
      }
    }

    return null;
  }, [1188692.84, 6767643.28]);

  const boundingBox = await mapViewport.boundingBox();
  expect(boundingBox).not.toBeNull();
  if (!boundingBox) {
    throw new Error('Map viewport has no bounding box.');
  }

  const clickPosition = mapPixel ?? {
    x: boundingBox.width / 2,
    y: boundingBox.height / 2
  };

  await mapViewport.click({ position: clickPosition });

  const infoPanel =
    (await page.getByTestId('info-panel').count()) > 0
      ? page.getByTestId('info-panel').first()
      : page.locator('body');

  await expect(infoPanel.getByText(/^UV-Index Station$/)).toBeVisible();
  await expect(infoPanel.getByText(/^EUCOS Ground Station$/)).toBeVisible();
});
