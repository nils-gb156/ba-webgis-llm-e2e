// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const mapContainer = page.getByTestId('map-container');
  const initialExtentButton = page.getByTestId('initial-extent-button');
  const uviStationSection = page.getByTestId('uvi-station-section');
  const eucosStationSection = page.getByTestId('eucos-station-section');

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

  const getTargetPixel = async (): Promise<[number, number] | undefined> => {
    return await page.evaluate((coordinate) => {
      const map = (globalThis as {
        __openPioneerMap?: {
          olMap?: {
            getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
          };
        };
      }).__openPioneerMap;
      const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
      return Array.isArray(pixel) && pixel.length >= 2
        ? ([pixel[0], pixel[1]] as [number, number])
        : undefined;
    }, targetCoordinate);
  };

  await expect(mapContainer).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  if ((await measurementPanel.isVisible()) || (await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementPanel).toBeHidden();

  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  let targetPixel: [number, number] | undefined;
  await expect.poll(async () => {
    targetPixel = await getTargetPixel();
    return targetPixel;
  }).toBeTruthy();

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const targetPixelInsideViewport = (pixel: [number, number]) =>
    pixel[0] >= 0 &&
    pixel[1] >= 0 &&
    pixel[0] <= mapBox.width &&
    pixel[1] <= mapBox.height;

  if (!targetPixel || !targetPixelInsideViewport(targetPixel)) {
    await initialExtentButton.click();

    await expect.poll(async () => {
      targetPixel = await getTargetPixel();
      return targetPixel ? targetPixelInsideViewport(targetPixel) : false;
    }).toBe(true);
  }

  if (!targetPixel) {
    throw new Error('Could not resolve a clickable map pixel for the target coordinate.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(targetPixel[0]),
      y: Math.round(targetPixel[1]),
    },
  });

  await expect(uviStationSection).toBeVisible();
  await expect(uviStationSection).toContainText(/UV-Index Station/i);

  await expect(eucosStationSection).toBeVisible();
  await expect(eucosStationSection).toContainText(/EUCOS Ground Station/i);
});
