// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanelToggle).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  if (!(await infoPanel.isVisible())) {
    const pressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
  }

  const featureInfoRequestUrls: string[] = [];
  page.on('request', (request) => {
    if (/getfeatureinfo/i.test(request.url())) {
      featureInfoRequestUrls.push(request.url());
    }
  });

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
  const getClickPosition = async () =>
    page.evaluate((coordinate: [number, number]) => {
      const map = (globalThis as {
        __openPioneerMap?: {
          olMap?: {
            getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
          };
        };
      }).__openPioneerMap;

      const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
      if (!Array.isArray(pixel) || pixel.length < 2) {
        return undefined;
      }

      return {
        x: Math.round(pixel[0]),
        y: Math.round(pixel[1])
      };
    }, targetCoordinate);

  await expect.poll(getClickPosition).toBeDefined();
  const clickPosition = await getClickPosition();
  if (!clickPosition) {
    throw new Error('Failed to calculate map click position for the target coordinate.');
  }

  expect(clickPosition.x).toBeGreaterThanOrEqual(0);
  expect(clickPosition.y).toBeGreaterThanOrEqual(0);

  await mapContainer.click({ position: clickPosition });

  await expect.poll(() => featureInfoRequestUrls.length).toBeGreaterThan(0);
  await expect(infoPanel).toContainText('UV-Index Station');
  await expect(infoPanel).toContainText('EUCOS Ground Station');
});
