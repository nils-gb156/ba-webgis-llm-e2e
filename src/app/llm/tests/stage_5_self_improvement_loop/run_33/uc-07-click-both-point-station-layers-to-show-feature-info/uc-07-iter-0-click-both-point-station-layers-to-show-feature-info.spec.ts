// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getActiveBaseLayerTitle,
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

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect
    .poll(async () => (await measurementToggle.getAttribute('aria-pressed')) === 'true')
    .toBe(false);

  const eucosCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  const uviCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });

  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }
  await expect(uviCheckbox).toBeChecked();

  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

  const getTargetPixel = async (): Promise<{ x: number; y: number } | undefined> => {
    return await page.evaluate(([x, y]) => {
      const map = (globalThis as any).__openPioneerMap;
      const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
      if (!Array.isArray(pixel) || pixel.length < 2) {
        return undefined;
      }
      return {
        x: Math.round(pixel[0]),
        y: Math.round(pixel[1])
      };
    }, targetCoordinate);
  };

  await expect.poll(getTargetPixel).toBeTruthy();

  const targetPixel = await getTargetPixel();
  if (!targetPixel) {
    throw new Error('Could not determine map pixel for target coordinate.');
  }

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box is not available.');
  }

  expect(targetPixel.x).toBeGreaterThan(0);
  expect(targetPixel.y).toBeGreaterThan(0);
  expect(targetPixel.x).toBeLessThan(mapBox.width);
  expect(targetPixel.y).toBeLessThan(mapBox.height);

  await mapContainer.click({ position: targetPixel });

  await expect(
    infoPanel.getByRole('heading', { name: /^UV-Index Station\b/i })
  ).toBeVisible();
  await expect(
    infoPanel.getByRole('heading', { name: /^EUCOS Ground Station\b/i })
  ).toBeVisible();
});
