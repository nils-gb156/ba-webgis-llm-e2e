// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  const readZoomLevel = async (): Promise<number | undefined> => {
    return await page.evaluate(() => {
      const isObjectLike = (value: unknown): value is Record<PropertyKey, unknown> =>
        !!value && (typeof value === 'object' || typeof value === 'function');

      const looksLikeOpenLayersMap = (
        value: unknown
      ): value is {
        getView: () => { getZoom?: () => number | undefined } | undefined;
        getTargetElement: () => HTMLElement | null;
        getViewport: () => HTMLElement | null;
      } =>
        isObjectLike(value) &&
        typeof value.getView === 'function' &&
        typeof value.getTargetElement === 'function' &&
        typeof value.getViewport === 'function';

      const roots: unknown[] = [window, document, document.body];
      for (const child of Array.from(document.body?.children ?? []).slice(0, 25)) {
        roots.push(child);
      }

      const seen = new WeakSet<object>();
      const queue: Array<{ value: unknown; depth: number }> = roots.map((value) => ({ value, depth: 0 }));
      const maxDepth = 6;
      const maxNodes = 5000;
      let visited = 0;

      while (queue.length > 0 && visited < maxNodes) {
        const current = queue.shift();
        if (!current) {
          break;
        }

        const { value, depth } = current;
        if (!isObjectLike(value)) {
          continue;
        }
        if (seen.has(value)) {
          continue;
        }

        seen.add(value);
        visited += 1;

        if (looksLikeOpenLayersMap(value)) {
          try {
            const targetElement = value.getTargetElement();
            const zoom = value.getView()?.getZoom?.();
            if (
              targetElement instanceof HTMLElement &&
              document.contains(targetElement) &&
              typeof zoom === 'number' &&
              Number.isFinite(zoom)
            ) {
              return zoom;
            }
          } catch {
            // Continue searching.
          }
        }

        if (depth >= maxDepth) {
          continue;
        }

        const keys: PropertyKey[] = [];
        try {
          keys.push(...Object.getOwnPropertyNames(value).slice(0, 100));
        } catch {
          // Ignore inaccessible properties.
        }
        try {
          keys.push(...Object.getOwnPropertySymbols(value).slice(0, 20));
        } catch {
          // Ignore inaccessible symbols.
        }

        for (const key of keys) {
          try {
            const nextValue = value[key];
            if (isObjectLike(nextValue)) {
              queue.push({ value: nextValue, depth: depth + 1 });
            }
          } catch {
            // Ignore getters that throw.
          }
        }
      }

      return undefined;
    });
  };

  let initialZoom: number | undefined;
  await expect
    .poll(async () => {
      initialZoom = await readZoomLevel();
      return initialZoom;
    })
    .not.toBeUndefined();

  if (initialZoom === undefined) {
    throw new Error('Could not determine the initial map zoom level.');
  }

  await zoomInButton.click();

  let zoomAfterZoomIn: number | undefined;
  await expect.poll(async () => {
    zoomAfterZoomIn = await readZoomLevel();
    return zoomAfterZoomIn;
  }).toBeGreaterThan(initialZoom);

  if (zoomAfterZoomIn === undefined) {
    throw new Error('Could not determine the map zoom level after zooming in.');
  }

  await zoomOutButton.click();

  await expect.poll(async () => {
    return await readZoomLevel();
  }).toBeLessThan(zoomAfterZoomIn);
});
