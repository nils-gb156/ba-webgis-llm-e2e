// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const measurementPanel = page.getByTestId('measurement-panel');
  const uviStationSection = page.getByTestId('uvi-station-section');
  const uviStationInfo = page.getByTestId('uvi-station-info');
  const eucosStationSection = page.getByTestId('eucos-station-section');
  const eucosStationInfo = page.getByTestId('eucos-station-info');

  await expect(mapContainer).toBeVisible();

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

  const stationCoordinate: [number, number] = [1188692.84, 6767643.28];

  await expect
    .poll(async () => {
      return await page.evaluate(([x, y]) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        const size = map?.olMap?.getSize?.();

        if (!pixel || !size || pixel.length < 2 || size.length < 2) {
          return false;
        }

        const [px, py] = pixel;
        const [width, height] = size;

        return (
          Number.isFinite(px) &&
          Number.isFinite(py) &&
          Number.isFinite(width) &&
          Number.isFinite(height) &&
          px >= 0 &&
          py >= 0 &&
          px <= width &&
          py <= height
        );
      }, stationCoordinate);
    })
    .toBe(true);

  const clickPosition = await page.evaluate(([x, y]) => {
    const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
    const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);

    if (!pixel || pixel.length < 2) {
      return undefined;
    }

    return {
      x: Math.round(pixel[0]),
      y: Math.round(pixel[1]),
    };
  }, stationCoordinate);

  if (!clickPosition) {
    throw new Error('Could not determine a map click position for the target station coordinate.');
  }

  await mapContainer.click({ position: clickPosition });

  await expect(infoPanel).toBeVisible();
  await expect(uviStationSection).toBeVisible();
  await expect(uviStationInfo).toBeVisible();
  await expect(uviStationInfo).toContainText(/\S/);
  await expect(eucosStationSection).toBeVisible();
  await expect(eucosStationInfo).toBeVisible();
  await expect(eucosStationInfo).toContainText(/\S/);
});
