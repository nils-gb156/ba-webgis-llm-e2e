// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const zoomInCandidates = [
    page.getByRole('button', { name: 'Zoom in', exact: true }),
    page.getByTitle('Zoom in'),
    page.getByRole('button', { name: '+', exact: true })
  ];

  let zoomInButton = zoomInCandidates[0];
  for (const candidate of zoomInCandidates) {
    if ((await candidate.count()) > 0) {
      zoomInButton = candidate.first();
      break;
    }
  }

  const zoomOutCandidates = [
    page.getByRole('button', { name: 'Zoom out', exact: true }),
    page.getByTitle('Zoom out'),
    page.getByRole('button', { name: '-', exact: true }),
    page.getByRole('button', { name: '−', exact: true })
  ];

  let zoomOutButton = zoomOutCandidates[0];
  for (const candidate of zoomOutCandidates) {
    if ((await candidate.count()) > 0) {
      zoomOutButton = candidate.first();
      break;
    }
  }

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  const readZoomLevel = async (): Promise<number | undefined> => {
    return await page.evaluate(() => {
      const seen = new WeakSet<object>();
      const queue: Array<{ value: unknown; depth: number }> = [];

      const enqueue = (value: unknown, depth: number) => {
        if (depth < 0 || (!value || (typeof value !== 'object' && typeof value !== 'function'))) {
          return;
        }

        const objectValue = value as object;
        if (seen.has(objectValue)) {
          return;
        }

        seen.add(objectValue);
        queue.push({ value, depth });
      };

      const getZoomFromCandidate = (candidate: unknown): number | undefined => {
        if (!candidate || (typeof candidate !== 'object' && typeof candidate !== 'function')) {
          return undefined;
        }

        const maybeMap = candidate as {
          getView?: () => { getZoom?: () => unknown } | undefined;
          getTargetElement?: () => unknown;
          getSize?: () => unknown;
        };

        try {
          if (
            typeof maybeMap.getView === 'function' &&
            typeof maybeMap.getTargetElement === 'function' &&
            typeof maybeMap.getSize === 'function'
          ) {
            const zoom = maybeMap.getView()?.getZoom?.();
            const target = maybeMap.getTargetElement();
            if (typeof zoom === 'number' && (target === undefined || target instanceof HTMLElement)) {
              return zoom;
            }
          }
        } catch {
          return undefined;
        }

        return undefined;
      };

      const rootElements = [
        document.querySelector('button[title="Zoom in"]'),
        document.querySelector('button[title="Zoom out"]'),
        ...Array.from(document.querySelectorAll('[class*="ol-"]')),
        ...Array.from(document.querySelectorAll('canvas')),
        document.body,
        window
      ].filter(Boolean);

      for (const root of rootElements) {
        enqueue(root, root === window ? 2 : 7);
      }

      const skippedKeys = new Set([
        'children',
        'childNodes',
        'parentNode',
        'parentElement',
        'previousSibling',
        'nextSibling',
        'previousElementSibling',
        'nextElementSibling',
        'firstChild',
        'lastChild',
        'ownerDocument',
        'documentElement',
        'body',
        'defaultView',
        'window',
        'self',
        'frames',
        'top',
        'parent',
        'opener'
      ]);

      let inspectedObjects = 0;
      while (queue.length > 0 && inspectedObjects < 5000) {
        const current = queue.shift();
        if (!current) {
          break;
        }

        inspectedObjects += 1;

        const zoom = getZoomFromCandidate(current.value);
        if (typeof zoom === 'number') {
          return zoom;
        }

        if (current.depth === 0) {
          continue;
        }

        let keys: string[] = [];
        try {
          keys = Object.getOwnPropertyNames(current.value).slice(0, 200);
        } catch {
          continue;
        }

        for (const key of keys) {
          if (skippedKeys.has(key)) {
            continue;
          }

          let child: unknown;
          try {
            child = (current.value as Record<string, unknown>)[key];
          } catch {
            continue;
          }

          enqueue(child, current.depth - 1);
        }
      }

      return undefined;
    });
  };

  let initialZoom = Number.NEGATIVE_INFINITY;
  await expect
    .poll(async () => {
      const zoom = await readZoomLevel();
      if (typeof zoom === 'number') {
        initialZoom = zoom;
        return zoom;
      }
      return Number.NEGATIVE_INFINITY;
    })
    .toBeGreaterThan(Number.NEGATIVE_INFINITY);

  await zoomInButton.click();

  let zoomAfterZoomIn = Number.NEGATIVE_INFINITY;
  await expect
    .poll(async () => {
      const zoom = await readZoomLevel();
      if (typeof zoom === 'number') {
        zoomAfterZoomIn = zoom;
        return zoom;
      }
      return Number.NEGATIVE_INFINITY;
    })
    .toBeGreaterThan(initialZoom);

  await zoomOutButton.click();

  await expect
    .poll(async () => {
      const zoom = await readZoomLevel();
      return typeof zoom === 'number' ? zoom : Number.POSITIVE_INFINITY;
    })
    .toBeLessThan(zoomAfterZoomIn);
});
