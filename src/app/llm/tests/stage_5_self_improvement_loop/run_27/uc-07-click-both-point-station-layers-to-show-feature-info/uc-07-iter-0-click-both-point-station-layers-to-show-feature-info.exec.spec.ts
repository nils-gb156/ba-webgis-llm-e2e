// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect.poll(() => measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

  const uviStationsCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  if (!(await uviStationsCheckbox.isChecked())) {
    await uviStationsCheckbox.click({ force: true });
  }
  await expect(uviStationsCheckbox).toBeChecked();

  const eucosStationsCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  if (!(await eucosStationsCheckbox.isChecked())) {
    await eucosStationsCheckbox.click({ force: true });
  }
  await expect(eucosStationsCheckbox).toBeChecked();

  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  let clickPosition: { x: number; y: number } | undefined;
  await expect
    .poll(async () => {
      clickPosition = await page.evaluate(() => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([1188692.84, 6767643.28]);
        const size = map?.olMap?.getSize?.();

        if (!Array.isArray(pixel) || pixel.length < 2 || !Array.isArray(size) || size.length < 2) {
          return undefined;
        }

        const [x, y] = pixel;
        const [width, height] = size;

        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(width) || !Number.isFinite(height)) {
          return undefined;
        }

        if (x < 0 || y < 0 || x > width || y > height) {
          return undefined;
        }

        return {
          x: Math.round(x),
          y: Math.round(y)
        };
      });

      return clickPosition;
    })
    .not.toBeUndefined();

  if (!clickPosition) {
    throw new Error('Could not determine a clickable pixel position for the target map coordinate.');
  }

  await mapContainer.click({ position: clickPosition });

  await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
