// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();
  }

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();
  }

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

  const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });
  if (!(await eucosStationsCheckbox.isChecked())) {
    await eucosStationsCheckbox.click({ force: true });
  }
  await expect(eucosStationsCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  if (!(await uviStationsCheckbox.isChecked())) {
    await uviStationsCheckbox.click({ force: true });
  }
  await expect(uviStationsCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect.poll(() => measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

  const normalizeText = (value: string | null) => (value ?? '').replace(/\s+/g, ' ').trim();
  const initialInfoPanelText = normalizeText(await infoPanel.textContent());

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
  let targetPixel: [number, number] | undefined;

  await expect
    .poll(async () => {
      targetPixel = await page.evaluate(([x, y]) => {
        const map = (
          globalThis as {
            __openPioneerMap?: {
              olMap?: {
                getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
              };
            };
          }
        ).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        return Array.isArray(pixel) && pixel.length >= 2 ? [pixel[0], pixel[1]] : undefined;
      }, targetCoordinate);
      return targetPixel;
    })
    .toBeDefined();

  const [pixelX, pixelY] = targetPixel!;
  expect(pixelX).toBeGreaterThanOrEqual(0);
  expect(pixelY).toBeGreaterThanOrEqual(0);

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  if (mapBox) {
    expect(pixelX).toBeLessThanOrEqual(mapBox.width);
    expect(pixelY).toBeLessThanOrEqual(mapBox.height);
  }

  await mapContainer.click({
    position: {
      x: Math.round(pixelX),
      y: Math.round(pixelY)
    },
    force: true
  });

  await expect
    .poll(async () => normalizeText(await infoPanel.textContent()))
    .not.toBe(initialInfoPanelText);

  await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
