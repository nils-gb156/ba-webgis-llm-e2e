// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const uviSection = page.getByTestId('uvi-station-section');
  const uviInfo = page.getByTestId('uvi-station-info');

  await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();
  await expect(mapContainer).toBeVisible();

  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
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

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  if ((await measurementToggle.getAttribute('aria-pressed')) !== null) {
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
  }

  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

  const getClickPosition = async (): Promise<{ x: number; y: number } | undefined> => {
    return await page.evaluate(([x, y]) => {
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

      if (!Number.isFinite(pixel[0]) || !Number.isFinite(pixel[1])) {
        return undefined;
      }

      return { x: pixel[0], y: pixel[1] };
    }, targetCoordinate);
  };

  await expect
    .poll(async () => {
      const clickPosition = await getClickPosition();
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

  const clickPosition = await getClickPosition();
  if (!clickPosition) {
    throw new Error('Could not determine a clickable pixel for the target map coordinate.');
  }

  await mapContainer.click({ position: clickPosition });

  await expect
    .poll(async () => {
      const highlighted = await getHighlightedCoordinate(page);
      return (
        highlighted !== undefined &&
        Math.abs(highlighted[0] - targetCoordinate[0]) < 500 &&
        Math.abs(highlighted[1] - targetCoordinate[1]) < 500
      );
    })
    .toBe(true);

  await expect(uviSection).toBeVisible({ timeout: 30000 });
  await expect(uviSection).toContainText(/UV-Index Station/i);
  await expect(uviInfo).toContainText(/Identifier/i);
  await expect(uviInfo).toContainText(/Name/i);
  await expect(uviInfo).toContainText(/Country/i);

  for (let attempt = 0; attempt < 8; attempt++) {
    const currentText = (await infoPanel.textContent()) ?? '';
    if (/EUCOS Ground Station/i.test(currentText)) {
      break;
    }
    await infoPanel.hover();
    await page.mouse.wheel(0, 1500);
  }

  await expect
    .poll(async () => {
      const text = (await infoPanel.textContent()) ?? '';
      const eucosStart = text.indexOf('EUCOS Ground Station');
      return eucosStart >= 0 ? text.slice(eucosStart) : '';
    })
    .toMatch(/EUCOS Ground Station[\s\S]*(Identifier|Name|Alias|Country|Type|Station Height)/i);
});
