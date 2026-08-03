// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 3: Zoom in and out using the zoom buttons', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  let zoomInButton = page.getByRole('button', { name: 'Zoom in', exact: true });
  let zoomOutButton = page.getByRole('button', { name: 'Zoom out', exact: true });

  if ((await zoomInButton.count()) === 0 || (await zoomOutButton.count()) === 0) {
    const zoomControls = page.locator('.ol-zoom');
    zoomInButton = zoomControls.getByRole('button').first();
    zoomOutButton = zoomControls.getByRole('button').nth(1);
  }

  await expect(zoomInButton).toBeVisible();
  await expect(zoomOutButton).toBeVisible();

  const readMapZoom = async (): Promise<number | undefined> => {
    return await page.evaluate(() => {
      const viewport = document.querySelector('.ol-viewport');
      if (!viewport) {
        return undefined;
      }

      const isMapLike = (value: any): boolean => {
        if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
          return false;
        }

        try {
          const view = value.getView?.();
          const target = value.getTargetElement?.();
          return (
            typeof value.getView === 'function' &&
            typeof value.getTargetElement === 'function' &&
            !!view &&
            typeof view.getZoom === 'function' &&
            !!target &&
            target instanceof Element
          );
        } catch {
          return false;
        }
      };

      const matchesViewport = (value: any): boolean => {
        try {
          const target = value.getTargetElement();
          return target instanceof Element && (target.contains(viewport) || viewport.contains(target));
        } catch {
          return false;
        }
      };

      const getZoom = (value: any): number | undefined => {
        try {
          const zoom = value.getView().getZoom();
          return typeof zoom === 'number' ? zoom : undefined;
        } catch {
          return undefined;
        }
      };

      const directWindowCandidates: any[] = [];
      const win = window as Window & Record<string, unknown>;

      for (const key of ['map', 'olMap', '__map', '__olMap', 'openLayersMap', 'openlayersMap']) {
        directWindowCandidates.push(win[key]);
      }

      for (const key of Object.getOwnPropertyNames(win)) {
        if (/map/i.test(key)) {
          directWindowCandidates.push(win[key]);
        }
      }

      for (const candidate of directWindowCandidates) {
        if (isMapLike(candidate) && matchesViewport(candidate)) {
          return getZoom(candidate);
        }
      }

      const roots: any[] = [];

      const collectReactInternals = (element: Element | null) => {
        if (!element) {
          return;
        }

        const record = element as Element & Record<string, unknown>;
        for (const key of Object.getOwnPropertyNames(record)) {
          if (
            key.startsWith('__reactFiber$') ||
            key.startsWith('__reactProps$') ||
            key.startsWith('__reactContainer$')
          ) {
            roots.push(record[key]);
          }
        }
      };

      collectReactInternals(document.getElementById('root'));
      collectReactInternals(viewport);
      collectReactInternals(viewport.parentElement);
      collectReactInternals(viewport.parentElement?.parentElement);

      const buttons = Array.from(document.querySelectorAll('button'));
      const zoomButtons = buttons.filter((button) => {
        const text = (button.textContent ?? '').trim();
        const title = (button.getAttribute('title') ?? '').trim();
        const ariaLabel = (button.getAttribute('aria-label') ?? '').trim();

        return (
          text === '+' ||
          text === '-' ||
          text === '−' ||
          /zoom in/i.test(title) ||
          /zoom out/i.test(title) ||
          /zoom in/i.test(ariaLabel) ||
          /zoom out/i.test(ariaLabel)
        );
      });

      for (const button of zoomButtons) {
        collectReactInternals(button);
        collectReactInternals(button.parentElement);
      }

      const queue: Array<[any, number]> = roots.map((root) => [root, 0]);
      const seen = new Set<any>();

      while (queue.length > 0) {
        const [current, depth] = queue.shift()!;

        if (!current || (typeof current !== 'object' && typeof current !== 'function')) {
          continue;
        }

        if (seen.has(current)) {
          continue;
        }
        seen.add(current);

        if (isMapLike(current) && matchesViewport(current)) {
          return getZoom(current);
        }

        if (depth >= 14) {
          continue;
        }

        const nextValues: any[] = [];

        if (Array.isArray(current)) {
          nextValues.push(...current.slice(0, 100));
        } else {
          for (const key of Object.getOwnPropertyNames(current).slice(0, 120)) {
            if (
              key === 'ownerDocument' ||
              key === 'parentNode' ||
              key === 'childNodes' ||
              key === 'children' ||
              key === 'nextSibling' ||
              key === 'previousSibling'
            ) {
              continue;
            }

            try {
              nextValues.push(current[key]);
            } catch {
              // ignore inaccessible properties
            }
          }
        }

        for (const value of nextValues) {
          queue.push([value, depth + 1]);
        }
      }

      return undefined;
    });
  };

  await expect
    .poll(readMapZoom, {
      message: 'The current map zoom level should be readable once the app is loaded.'
    })
    .not.toBeUndefined();

  const initialZoom = await readMapZoom();
  if (initialZoom === undefined) {
    throw new Error('Failed to read the initial map zoom level.');
  }

  await zoomInButton.click();

  await expect
    .poll(readMapZoom, {
      message: 'After clicking "Zoom in", the map zoom level should be higher than before.'
    })
    .toBeGreaterThan(initialZoom);

  const zoomAfterZoomIn = await readMapZoom();
  if (zoomAfterZoomIn === undefined) {
    throw new Error('Failed to read the map zoom level after zooming in.');
  }

  await zoomOutButton.click();

  await expect
    .poll(readMapZoom, {
      message: 'After clicking "Zoom out", the map zoom level should be lower than after zooming in.'
    })
    .toBeLessThan(zoomAfterZoomIn);
});
