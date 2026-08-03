// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/', { waitUntil: 'domcontentloaded' });

  const observedTileZooms: number[] = [];

  const extractZoomFromUrl = (urlString: string): number | undefined => {
    try {
      const url = new URL(urlString);

      for (const key of ['z', 'zoom', 'tilematrix', 'tileMatrix']) {
        const value = url.searchParams.get(key);
        if (!value) {
          continue;
        }

        const numericMatch = value.match(/(\d+)(?!.*\d)/);
        if (numericMatch) {
          return Number(numericMatch[1]);
        }
      }

      const pathSegments = url.pathname
        .split('/')
        .map((segment) => segment.replace(/\.[^.]+$/, ''))
        .filter(Boolean);

      const numericSegments = pathSegments
        .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : undefined))
        .filter((value): value is number => value !== undefined);

      if (numericSegments.length >= 3) {
        return numericSegments[numericSegments.length - 3];
      }
    } catch {
      return undefined;
    }

    return undefined;
  };

  page.on('request', (request) => {
    if (request.resourceType() !== 'image') {
      return;
    }

    const zoom = extractZoomFromUrl(request.url());
    if (zoom !== undefined) {
      observedTileZooms.push(zoom);
    }
  });

  const readZoomFromApp = async (): Promise<number | undefined> => {
    return await page.evaluate(() => {
      const roots: any[] = [];
      const seen = new Set<object>();
      const queue: any[] = [];

      const enqueue = (value: any) => {
        if (value === null || value === undefined) {
          return;
        }
        const valueType = typeof value;
        if (valueType !== 'object' && valueType !== 'function') {
          return;
        }
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
        queue.push(value);
      };

      const readZoom = (candidate: any): number | undefined => {
        try {
          if (candidate && typeof candidate.getView === 'function') {
            const view = candidate.getView();
            if (view && typeof view.getZoom === 'function') {
              const zoom = view.getZoom();
              if (typeof zoom === 'number' && Number.isFinite(zoom)) {
                return zoom;
              }
            }
          }

          if (
            candidate &&
            typeof candidate.getZoom === 'function' &&
            (typeof candidate.setZoom === 'function' || typeof candidate.animate === 'function')
          ) {
            const zoom = candidate.getZoom();
            if (typeof zoom === 'number' && Number.isFinite(zoom)) {
              return zoom;
            }
          }

          if (candidate && candidate.current) {
            return readZoom(candidate.current);
          }
        } catch {
          return undefined;
        }

        return undefined;
      };

      for (const key of Object.getOwnPropertyNames(window)) {
        if (!/(^ol$|openlayers|map|view)/i.test(key)) {
          continue;
        }

        try {
          roots.push((window as any)[key]);
        } catch {
          // ignore inaccessible properties
        }
      }

      roots.push(document.body);

      for (const element of Array.from(document.querySelectorAll('*'))) {
        for (const key of Object.getOwnPropertyNames(element)) {
          if (
            key.startsWith('__reactFiber$') ||
            key.startsWith('__reactProps$') ||
            key.startsWith('__reactContainer$')
          ) {
            try {
              roots.push((element as any)[key]);
            } catch {
              // ignore inaccessible properties
            }
          }
        }
      }

      for (const root of roots) {
        enqueue(root);
      }

      let inspected = 0;
      while (queue.length > 0 && inspected < 3000) {
        const current = queue.shift();
        inspected += 1;

        const zoom = readZoom(current);
        if (zoom !== undefined) {
          return zoom;
        }

        if (Array.isArray(current)) {
          for (const item of current) {
            enqueue(item);
          }
          continue;
        }

        const priorityKeys = [
          'current',
          'map',
          'view',
          'stateNode',
          'memoizedState',
          'memoizedProps',
          'child',
          'sibling',
          'return',
          'dependencies',
          'updateQueue'
        ];

        for (const key of priorityKeys) {
          try {
            enqueue(current[key]);
          } catch {
            // ignore inaccessible properties
          }
        }

        try {
          const ownKeys = Object.getOwnPropertyNames(current).slice(0, 25);
          for (const key of ownKeys) {
            if (
              key === 'parentNode' ||
              key === 'parentElement' ||
              key === 'ownerDocument' ||
              key === 'window' ||
              key === 'self'
            ) {
              continue;
            }

            try {
              enqueue(current[key]);
            } catch {
              // ignore inaccessible properties
            }
          }
        } catch {
          // ignore objects without enumerable properties
        }
      }

      return undefined;
    });
  };

  const readZoomLevel = async (): Promise<number | undefined> => {
    const appZoom = await readZoomFromApp();
    if (appZoom !== undefined) {
      return appZoom;
    }

    return observedTileZooms.at(-1);
  };

  const zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  const zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  await expect.poll(readZoomLevel).toBeDefined();
  const initialZoom = (await readZoomLevel()) as number;

  await zoomInButton.click();
  await expect.poll(readZoomLevel).toBeGreaterThan(initialZoom);
  const zoomAfterZoomIn = (await readZoomLevel()) as number;

  await zoomOutButton.click();
  await expect.poll(readZoomLevel).toBeLessThan(zoomAfterZoomIn);
});
