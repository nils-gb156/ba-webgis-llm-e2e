// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  for (const infoToggleName of ['Info', 'Information', 'Feature Info']) {
    const infoToggle = page.getByRole('button', { name: infoToggleName, exact: true });
    if ((await infoToggle.count()) > 0) {
      const pressed = await infoToggle.first().getAttribute('aria-pressed');
      if (pressed !== 'true') {
        await infoToggle.first().click();
      }
      break;
    }
  }

  for (const measurementToggleName of ['Measurement', 'Measure']) {
    const measurementToggle = page.getByRole('button', {
      name: measurementToggleName,
      exact: true
    });
    if ((await measurementToggle.count()) > 0) {
      const pressed = await measurementToggle.first().getAttribute('aria-pressed');
      if (pressed === 'true') {
        await measurementToggle.first().click();
      }
      break;
    }
  }

  const layersToggle = page.getByRole('button', { name: 'Layers', exact: true });
  if ((await layersToggle.count()) > 0) {
    const pressed = await layersToggle.first().getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await layersToggle.first().click();
    }
  }

  const uvLayerToggle = page.getByRole('checkbox', { name: /^UV-Index Stations?$/i });
  const eucosLayerToggle = page.getByRole('checkbox', { name: /^EUCOS Ground Stations?$/i });

  expect(await uvLayerToggle.count()).toBeGreaterThan(0);
  expect(await eucosLayerToggle.count()).toBeGreaterThan(0);

  if (!(await uvLayerToggle.first().isChecked())) {
    await uvLayerToggle.first().click({ force: true });
  }
  await expect(uvLayerToggle.first()).toBeChecked();

  if (!(await eucosLayerToggle.first().isChecked())) {
    await eucosLayerToggle.first().click({ force: true });
  }
  await expect(eucosLayerToggle.first()).toBeChecked();

  await page.waitForLoadState('networkidle');

  const targetCoordinate = [1188692.84, 6767643.28];

  const resolveMapClickPosition = async () =>
    await page.evaluate((coordinate: number[]) => {
      const roots = [document.getElementById('root'), document.body, window].filter(Boolean);
      const visited = new Set<object>();
      const queue: unknown[] = [...roots];
      const candidates: unknown[] = [];

      while (queue.length > 0 && visited.size < 8000) {
        const current = queue.shift();
        if (!current || (typeof current !== 'object' && typeof current !== 'function')) {
          continue;
        }

        if (visited.has(current as object)) {
          continue;
        }
        visited.add(current as object);

        try {
          const value = current as {
            getPixelFromCoordinate?: (coord: number[]) => number[];
            getTargetElement?: () => Element | null;
            getView?: () => unknown;
          };
          if (
            typeof value.getPixelFromCoordinate === 'function' &&
            typeof value.getTargetElement === 'function' &&
            typeof value.getView === 'function'
          ) {
            candidates.push(current);
          }
        } catch {
          // ignore inaccessible properties
        }

        let propertyNames: string[] = [];
        try {
          propertyNames = Object.getOwnPropertyNames(current);
        } catch {
          // ignore inaccessible objects
        }

        for (const propertyName of propertyNames) {
          let child: unknown;
          try {
            child = (current as Record<string, unknown>)[propertyName];
          } catch {
            continue;
          }

          if (!child || (typeof child !== 'object' && typeof child !== 'function')) {
            continue;
          }

          if (Array.isArray(child)) {
            for (const item of child) {
              if (item && (typeof item === 'object' || typeof item === 'function')) {
                queue.push(item);
              }
            }
          } else {
            queue.push(child);
          }
        }
      }

      for (const candidate of candidates) {
        try {
          const map = candidate as {
            getPixelFromCoordinate: (coord: number[]) => number[];
            getTargetElement: () => Element | null;
          };
          const targetElement = map.getTargetElement();
          const viewport =
            targetElement?.querySelector?.('.ol-viewport') instanceof HTMLElement
              ? (targetElement.querySelector('.ol-viewport') as HTMLElement)
              : targetElement instanceof HTMLElement
                ? targetElement
                : null;

          if (!viewport) {
            continue;
          }

          const pixel = map.getPixelFromCoordinate(coordinate);
          if (!Array.isArray(pixel) || pixel.length < 2) {
            continue;
          }

          const x = Number(pixel[0]);
          const y = Number(pixel[1]);
          const rect = viewport.getBoundingClientRect();

          if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            rect.width <= 0 ||
            rect.height <= 0 ||
            x < 0 ||
            y < 0 ||
            x > rect.width ||
            y > rect.height
          ) {
            continue;
          }

          return { x, y };
        } catch {
          // try next candidate
        }
      }

      return null;
    }, targetCoordinate);

  await expect.poll(async () => await resolveMapClickPosition()).not.toBeNull();
  const mapClickPosition = await resolveMapClickPosition();
  if (!mapClickPosition) {
    throw new Error('Could not resolve a click position for the target map coordinate.');
  }

  let getFeatureInfoRequestUrl: string | undefined;
  page.on('request', request => {
    const url = request.url();
    if (url.toLowerCase().includes('getfeatureinfo')) {
      getFeatureInfoRequestUrl = url;
    }
  });

  const getFeatureInfoResponsePromise = page.waitForResponse(response => {
    return response.url().toLowerCase().includes('getfeatureinfo') && response.ok();
  });

  await mapViewport.click({
    position: {
      x: mapClickPosition.x,
      y: mapClickPosition.y
    }
  });

  await getFeatureInfoResponsePromise;
  await expect.poll(() => getFeatureInfoRequestUrl).toMatch(/getfeatureinfo/i);

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
