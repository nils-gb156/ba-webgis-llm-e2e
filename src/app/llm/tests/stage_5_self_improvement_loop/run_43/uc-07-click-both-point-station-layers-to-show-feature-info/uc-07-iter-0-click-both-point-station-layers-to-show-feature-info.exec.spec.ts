// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
  getActiveBaseLayerTitle,
  getMapCenter,
  getMapZoomLevel,
  isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  if (!(await layerSwitcher.isVisible())) {
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const uviStationsCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  const eucosStationsCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });

  await expect(uviStationsCheckbox).toBeChecked();
  await expect(eucosStationsCheckbox).toBeChecked();

  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
  const clickPosition = await page.evaluate((coordinate) => {
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

  expect(clickPosition).toBeDefined();
  if (!clickPosition) {
    throw new Error('Could not convert the target map coordinate to a click position.');
  }

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  expect(clickPosition.x).toBeGreaterThanOrEqual(0);
  expect(clickPosition.y).toBeGreaterThanOrEqual(0);
  expect(clickPosition.x).toBeLessThanOrEqual(mapBox.width);
  expect(clickPosition.y).toBeLessThanOrEqual(mapBox.height);

  await mapContainer.click({ position: clickPosition });

  await expect(infoPanel).toContainText('UV-Index Station');
  await expect(infoPanel).toContainText('EUCOS Ground Station');
});
