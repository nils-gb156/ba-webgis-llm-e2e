// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInButton = page.getByRole('button', { name: /^(Zoom in|\+)$/ });
  const zoomOutButton = page.getByRole('button', { name: /^(Zoom out|−|-)$/ });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  const getMapZoom = async (): Promise<number | undefined> => {
    return await page.evaluate(() => {
      const queue: unknown[] = [];
      const seen = new WeakSet<object>();
      const skipProps = new Set([
        'window',
        'self',
        'top',
        'parent',
        'frames',
        'frameElement',
        'ownerDocument',
        'document',
        'defaultView'
      ]);

      const enqueue = (value: unknown) => {
        if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
          queue.push(value);
        }
      };

      const tryGetZoom = (value: unknown): number | undefined => {
        if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
          return undefined;
        }

        const candidate = value as {
          getView?: () => { getZoom?: () => unknown } | undefined;
          getTargetElement?: () => unknown;
        };

        if (typeof candidate.getView !== 'function' || typeof candidate.getTargetElement !== 'function') {
          return undefined;
        }

        try {
          const view = candidate.getView();
          const targetElement = candidate.getTargetElement();
          const zoom = view && typeof view.getZoom === 'function' ? view.getZoom() : undefined;

          if (targetElement instanceof Element && typeof zoom === 'number') {
            return zoom;
          }
        } catch {
          return undefined;
        }

        return undefined;
      };

      enqueue(document.getElementById('root'));
      enqueue(document.body);

      for (const key of Object.getOwnPropertyNames(window)) {
        if (/map/i.test(key)) {
          try {
            enqueue((window as unknown as Record<string, unknown>)[key]);
          } catch {
            // ignore unreadable window properties
          }
        }
      }

      let visited = 0;
      while (queue.length > 0 && visited < 8000) {
        const current = queue.shift();
        if (!current || (typeof current !== 'object' && typeof current !== 'function')) {
          continue;
        }

        if (seen.has(current as object)) {
          continue;
        }
        seen.add(current as object);
        visited += 1;

        const zoom = tryGetZoom(current);
        if (typeof zoom === 'number') {
          return zoom;
        }

        if (Array.isArray(current)) {
          for (const item of current.slice(0, 100)) {
            enqueue(item);
          }
        }

        let propertyNames: string[] = [];
        try {
          if (current instanceof Element) {
            propertyNames = Object.getOwnPropertyNames(current).filter(
              (name) =>
                name.startsWith('__reactFiber$') ||
                name.startsWith('__reactProps$') ||
                name.startsWith('__reactContainer$')
            );
          } else {
            propertyNames = Object.getOwnPropertyNames(current as object).slice(0, 200);
          }
        } catch {
          propertyNames = [];
        }

        for (const propertyName of propertyNames) {
          if (skipProps.has(propertyName) || /^\d+$/.test(propertyName)) {
            continue;
          }

          try {
            enqueue((current as Record<string, unknown>)[propertyName]);
          } catch {
            // ignore unreadable properties
          }
        }
      }

      return undefined;
    });
  };

  await expect
    .poll(async () => {
      const zoom = await getMapZoom();
      return typeof zoom === 'number';
    })
    .toBe(true);

  const initialZoom = await getMapZoom();
  if (initialZoom === undefined) {
    throw new Error('Could not determine the initial map zoom level.');
  }

  await zoomInButton.click();

  await expect.poll(async () => await getMapZoom()).toBeGreaterThan(initialZoom);

  const zoomAfterIn = await getMapZoom();
  if (zoomAfterIn === undefined) {
    throw new Error('Could not determine the map zoom level after zooming in.');
  }
  expect(zoomAfterIn).toBeGreaterThan(initialZoom);

  await zoomOutButton.click();

  await expect.poll(async () => await getMapZoom()).toBeLessThan(zoomAfterIn);
});
