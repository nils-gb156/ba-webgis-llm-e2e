// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

  const infoPanel = page.getByTestId('info-panel');
  if (!(await infoPanel.isVisible())) {
    await page.getByTestId('info-panel-toggle').click();
  }
  await expect(infoPanel).toBeVisible();

  const measurementPanel = page.getByTestId('measurement-panel');
  if (await measurementPanel.isVisible()) {
    await page.getByTestId('measurement-toggle').click();
  }
  await expect(measurementPanel).toBeHidden();

  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

  const getTargetPixel = async (): Promise<{ x: number; y: number } | undefined> => {
    return await page.evaluate(([x, y]) => {
      const map = (globalThis as {
        __openPioneerMap?: {
          olMap?: {
            getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
            getSize?: () => number[] | undefined;
          };
        };
      }).__openPioneerMap;

      const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
      const size = map?.olMap?.getSize?.();

      if (!pixel || pixel.length < 2 || !size || size.length < 2) {
        return undefined;
      }

      const [px, py] = pixel;
      const [width, height] = size;

      if (px < 0 || py < 0 || px > width || py > height) {
        return undefined;
      }

      return { x: px, y: py };
    }, targetCoordinate);
  };

  await expect.poll(getTargetPixel).not.toBeUndefined();
  const targetPixel = await getTargetPixel();
  if (!targetPixel) {
    throw new Error('Target map coordinate could not be converted to a visible pixel.');
  }

  const getFeatureInfoResponsePromise = page.waitForResponse((response) => {
    return response.ok() && /getfeatureinfo/i.test(response.url());
  });

  await page.getByTestId('map-container').click({
    position: {
      x: Math.round(targetPixel.x),
      y: Math.round(targetPixel.y),
    },
  });

  await getFeatureInfoResponsePromise;

  const uviStationSection = infoPanel.getByTestId('uvi-station-section');
  const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

  await expect(uviStationSection).toBeVisible();
  await expect(uviStationSection).toContainText('UV-Index Station');
  await expect.poll(async () => {
    const text = (await uviStationSection.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
    return text.length;
  }).toBeGreaterThan('UV-Index Station'.length);

  await expect(eucosStationSection).toBeVisible();
  await expect(eucosStationSection).toContainText('EUCOS Ground Station');
  await expect.poll(async () => {
    const text = (await eucosStationSection.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
    return text.length;
  }).toBeGreaterThan('EUCOS Ground Station'.length);
});
