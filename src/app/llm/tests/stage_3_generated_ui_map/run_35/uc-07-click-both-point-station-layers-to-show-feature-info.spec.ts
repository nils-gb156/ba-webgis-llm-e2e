// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from "../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();

  if (await measurementPanel.isVisible()) {
    await measurementToggle.click();
  }
  await expect(measurementPanel).toBeHidden();

  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  let mapClickPosition: { x: number; y: number } | null = null;
  await expect.poll(async () => {
    mapClickPosition = await page.evaluate((coordinate) => {
      const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
      const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
      const size = map?.olMap?.getSize?.();

      if (!Array.isArray(pixel) || pixel.length < 2 || !Array.isArray(size) || size.length < 2) {
        return null;
      }

      const [px, py] = pixel;
      const [width, height] = size;

      if (
        !Number.isFinite(px) ||
        !Number.isFinite(py) ||
        px < 0 ||
        py < 0 ||
        px > width ||
        py > height
      ) {
        return null;
      }

      return { x: Math.round(px), y: Math.round(py) };
    }, [1188692.84, 6767643.28]);

    return mapClickPosition !== null;
  }).toBe(true);

  const getFeatureInfoResponsePromise = page.waitForResponse((response) => {
    return (
      response.request().method() === 'GET' &&
      response.ok() &&
      response.url().toLowerCase().includes('getfeatureinfo')
    );
  });

  await Promise.all([
    getFeatureInfoResponsePromise,
    mapContainer.click({ position: mapClickPosition! })
  ]);

  const uviStationSection = infoPanel.getByTestId('uvi-station-section');
  const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

  await expect(infoPanel).toContainText('UV-Index Station');
  await expect(infoPanel).toContainText('EUCOS Ground Station');
  await expect(uviStationSection).toBeVisible();
  await expect(eucosStationSection).toBeVisible();
});
