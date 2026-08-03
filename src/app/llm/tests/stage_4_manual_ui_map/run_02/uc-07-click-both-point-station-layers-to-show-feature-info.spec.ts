// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

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

  const layerSwitcher = page.getByTestId('layer-switcher');
  if (!(await layerSwitcher.isVisible())) {
    await page.getByTestId('layer-switcher-toggle').click();
  }
  await expect(layerSwitcher).toBeVisible();

  if (!(await isLayerRendered(page, 'UV-Index Stations'))) {
    const uviCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
    await uviCheckbox.click({ force: true });
    await expect(uviCheckbox).toBeChecked();
  }
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  if (!(await isLayerRendered(page, 'EUCOS Ground Stations'))) {
    const eucosCheckbox = layerSwitcher.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    await eucosCheckbox.click({ force: true });
    await expect(eucosCheckbox).toBeChecked();
  }
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  let clickPosition: { x: number; y: number } | undefined;
  await expect
    .poll(async () => {
      clickPosition = await page.evaluate((coordinate: [number, number]) => {
        const map = (globalThis as {
          __openPioneerMap?: {
            olMap?: {
              getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
            };
          };
        }).__openPioneerMap;

        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return Array.isArray(pixel) && pixel.length >= 2
          ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
          : undefined;
      }, [1188692.84, 6767643.28] as [number, number]);

      return clickPosition !== undefined;
    })
    .toBe(true);

  await page.getByTestId('map-container').click({
    position: { x: clickPosition!.x, y: clickPosition!.y }
  });

  const uviSection = infoPanel.getByTestId('uvi-station-section');
  const uviInfo = infoPanel.getByTestId('uvi-station-info');
  await expect(uviSection).toBeVisible();
  await expect(uviInfo).toBeVisible();
  await expect(uviInfo).toContainText(/\S+/);

  const eucosSection = infoPanel.getByTestId('eucos-station-section');
  const eucosInfo = infoPanel.getByTestId('eucos-station-info');
  await expect(eucosSection).toBeVisible();
  await expect(eucosInfo).toBeVisible();
  await expect(eucosInfo).toContainText(/\S+/);
});
