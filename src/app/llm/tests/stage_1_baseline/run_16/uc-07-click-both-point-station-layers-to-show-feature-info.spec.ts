// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  const targetCoordinate = [1188692.84, 6767643.28] as const;

  const getClickPosition = async (): Promise<{ x: number; y: number } | null> => {
    return await page.evaluate(({ coordinate }) => {
      const queue: unknown[] = [];
      const seen = new WeakSet<object>();

      const enqueue = (value: unknown) => {
        if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
          return;
        }
        const objectValue = value as object;
        if (seen.has(objectValue)) {
          return;
        }
        seen.add(objectValue);
        queue.push(value);
      };

      const roots: unknown[] = [
        (window as any).map,
        (window as any).olMap,
        (window as any).__map,
        (window as any).__OL_MAP__,
        (window as any).__openlayersMap,
        window,
        document,
        document.body,
        ...Array.from(document.querySelectorAll('*')).slice(0, 300)
      ];

      for (const root of roots) {
        enqueue(root);
      }

      const isMapCandidate = (value: unknown): value is {
        getPixelFromCoordinate: (coordinate: number[]) => number[] | undefined;
        getViewport: () => HTMLElement | undefined;
        getSize: () => number[] | undefined;
      } => {
        return !!value &&
          typeof value === 'object' &&
          typeof (value as any).getPixelFromCoordinate === 'function' &&
          typeof (value as any).getViewport === 'function' &&
          typeof (value as any).getSize === 'function';
      };

      let inspected = 0;
      while (queue.length > 0 && inspected < 25000) {
        const current = queue.shift();
        inspected += 1;

        if (!current || (typeof current !== 'object' && typeof current !== 'function')) {
          continue;
        }

        if (isMapCandidate(current)) {
          try {
            const pixel = current.getPixelFromCoordinate([...coordinate]);
            const viewport = current.getViewport();
            const size = current.getSize();

            if (
              Array.isArray(pixel) &&
              pixel.length >= 2 &&
              Array.isArray(size) &&
              size.length >= 2 &&
              Number.isFinite(pixel[0]) &&
              Number.isFinite(pixel[1]) &&
              Number.isFinite(size[0]) &&
              Number.isFinite(size[1]) &&
              pixel[0] >= 0 &&
              pixel[1] >= 0 &&
              pixel[0] <= size[0] &&
              pixel[1] <= size[1] &&
              viewport instanceof HTMLElement
            ) {
              return {
                x: Math.round(pixel[0]),
                y: Math.round(pixel[1])
              };
            }
          } catch {
            // Ignore non-ready map candidates and continue searching.
          }
        }

        try {
          for (const key of Object.getOwnPropertyNames(current)) {
            if (
              key === 'window' ||
              key === 'self' ||
              key === 'parent' ||
              key === 'top' ||
              key === 'ownerDocument' ||
              key === 'defaultView'
            ) {
              continue;
            }

            let value: unknown;
            try {
              value = (current as Record<string, unknown>)[key];
            } catch {
              continue;
            }

            if (value === current) {
              continue;
            }

            if (Array.isArray(value)) {
              for (const item of value.slice(0, 50)) {
                enqueue(item);
              }
            } else {
              enqueue(value);
            }
          }
        } catch {
          // Ignore objects that cannot be enumerated.
        }
      }

      return null;
    }, { coordinate: targetCoordinate });
  };

  await expect.poll(async () => await getClickPosition()).not.toBeNull();

  const clickPosition = await getClickPosition();
  expect(clickPosition).not.toBeNull();
  if (!clickPosition) {
    throw new Error('Could not determine the pixel position for the target map coordinate.');
  }

  const getFeatureInfoResponse = page.waitForResponse(
    (response) =>
      response.ok() &&
      response.url().toLowerCase().includes('getfeatureinfo')
  );

  await Promise.all([
    getFeatureInfoResponse,
    mapViewport.click({
      position: {
        x: clickPosition.x,
        y: clickPosition.y
      }
    })
  ]);

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
