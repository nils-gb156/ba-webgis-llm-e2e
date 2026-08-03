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
  const eucosStationSection = page.getByTestId('eucos-station-section');

  await expect(mapContainer).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(measurementPanel).toBeHidden();

  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  let targetPixel: [number, number] | undefined;
  await expect
    .poll(async () => {
      targetPixel = await page.evaluate(([x, y]) => {
        const map = (globalThis as {
          __openPioneerMap?: {
            olMap: {
              getPixelFromCoordinate: (coordinate: [number, number]) => number[] | undefined;
            };
          };
        }).__openPioneerMap;

        const pixel = map?.olMap.getPixelFromCoordinate([x, y]);
        return Array.isArray(pixel) && pixel.length >= 2
          ? ([pixel[0], pixel[1]] as [number, number])
          : undefined;
      }, [1188692.84, 6767643.28] as [number, number]);

      return targetPixel;
    })
    .not.toBeUndefined();

  await mapContainer.click({
    position: {
      x: Math.round(targetPixel![0]),
      y: Math.round(targetPixel![1]),
    },
  });

  await expect(uviStationSection).toBeVisible();
  await expect(eucosStationSection).toBeVisible();
});
