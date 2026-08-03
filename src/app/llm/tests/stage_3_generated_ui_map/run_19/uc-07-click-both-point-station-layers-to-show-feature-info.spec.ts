// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getActiveBaseLayerTitle,
  getMapCenter,
  getMapZoomLevel,
  isLayerRendered
} from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const measurementPanel = page.getByTestId('measurement-panel');
  const uviStationSection = page.getByTestId('uvi-station-section');
  const eucosStationSection = page.getByTestId('eucos-station-section');

  await expect(mapContainer).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  if (!(await infoPanel.isVisible())) {
    await page.getByTestId('info-panel-toggle').click();
  }
  await expect(infoPanel).toBeVisible();

  if (await measurementPanel.isVisible()) {
    await page.getByTestId('measurement-toggle').click();
  }
  await expect(measurementPanel).toBeHidden();

  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

  let clickPosition: { x: number; y: number } | undefined;
  await expect
    .poll(async () => {
      clickPosition = await page.evaluate((coordinate) => {
        const map = (globalThis as any).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        if (!Array.isArray(pixel) || pixel.length < 2) {
          return undefined;
        }

        const [x, y] = pixel;
        if (
          typeof x !== 'number' ||
          typeof y !== 'number' ||
          Number.isNaN(x) ||
          Number.isNaN(y)
        ) {
          return undefined;
        }

        return { x: Math.round(x), y: Math.round(y) };
      }, targetCoordinate);

      return clickPosition;
    })
    .toBeTruthy();

  const mapBounds = await mapContainer.boundingBox();
  expect(mapBounds).not.toBeNull();
  expect(clickPosition!.x).toBeGreaterThanOrEqual(0);
  expect(clickPosition!.y).toBeGreaterThanOrEqual(0);
  expect(clickPosition!.x).toBeLessThan(mapBounds!.width);
  expect(clickPosition!.y).toBeLessThan(mapBounds!.height);

  const getFeatureInfoResponsePromise = page.waitForResponse((response) => {
    const url = response.url().toLowerCase();
    return response.request().method() === 'GET' && url.includes('getfeatureinfo') && response.ok();
  });

  await mapContainer.click({ position: clickPosition! });
  await getFeatureInfoResponsePromise;

  await expect(uviStationSection).toBeVisible();
  await expect(uviStationSection).toContainText('UV-Index Station');

  await expect(eucosStationSection).toBeVisible();
  await expect(eucosStationSection).toContainText('EUCOS Ground Station');

  await expect
    .poll(async () => ((await uviStationSection.textContent()) ?? '').replace(/\s+/g, ' ').trim().length)
    .toBeGreaterThan('UV-Index Station'.length);

  await expect
    .poll(async () => ((await eucosStationSection.textContent()) ?? '').replace(/\s+/g, ' ').trim().length)
    .toBeGreaterThan('EUCOS Ground Station'.length);
});
