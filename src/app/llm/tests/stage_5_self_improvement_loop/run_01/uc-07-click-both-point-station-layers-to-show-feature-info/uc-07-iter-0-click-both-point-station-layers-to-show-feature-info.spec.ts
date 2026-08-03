// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
  await expect(mapContainer).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    const pressed = await layerSwitcherToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

  if (!(await infoPanel.isVisible())) {
    const pressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

  if (!(await eucosCheckbox.isChecked())) {
    await eucosCheckbox.click({ force: true });
  }
  await expect(eucosCheckbox).toBeChecked();

  if (!(await uviCheckbox.isChecked())) {
    await uviCheckbox.click({ force: true });
  }
  await expect(uviCheckbox).toBeChecked();

  const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (measurementPressed === 'true') {
    await measurementToggle.click();
  }
  if ((await measurementToggle.getAttribute('aria-pressed')) !== null) {
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
  }

  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
  let clickPosition: { x: number; y: number } | undefined;

  await expect
    .poll(async () => {
      clickPosition = await page.evaluate(([x, y]) => {
        const exposed = globalThis as typeof globalThis & {
          __openPioneerMap?: {
            olMap?: {
              getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
            };
          };
        };

        const pixel = exposed.__openPioneerMap?.olMap?.getPixelFromCoordinate?.([x, y]);
        if (!Array.isArray(pixel) || pixel.length < 2) {
          return undefined;
        }

        return {
          x: Math.round(pixel[0]),
          y: Math.round(pixel[1])
        };
      }, targetCoordinate);

      const box = await mapContainer.boundingBox();
      return (
        clickPosition !== undefined &&
        box !== null &&
        clickPosition.x >= 0 &&
        clickPosition.y >= 0 &&
        clickPosition.x <= box.width &&
        clickPosition.y <= box.height
      );
    })
    .toBe(true);

  if (!clickPosition) {
    throw new Error('Could not determine a clickable pixel for the target map coordinate.');
  }

  await mapContainer.click({ position: clickPosition });

  await expect(infoPanel).toContainText(/UV-Index Station/i);
  await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
});
