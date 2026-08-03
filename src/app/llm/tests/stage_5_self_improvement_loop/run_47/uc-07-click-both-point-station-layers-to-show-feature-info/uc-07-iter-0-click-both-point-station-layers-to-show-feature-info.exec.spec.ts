// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const mapContainer = page.getByTestId('map-container');

  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
    await measurementToggle.click();
  }
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const uvIndexStationsCheckbox = page.getByRole('checkbox', {
    name: 'UV-Index Stations',
    exact: true
  });
  const eucosGroundStationsCheckbox = page.getByRole('checkbox', {
    name: 'EUCOS Ground Stations',
    exact: true
  });

  await expect(uvIndexStationsCheckbox).toBeChecked();
  await expect(eucosGroundStationsCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  await expect(infoPanel).not.toContainText('UV-Index Station');
  await expect(infoPanel).not.toContainText('EUCOS Ground Station');

  const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

  let clickPosition: { x: number; y: number } | undefined;
  await expect
    .poll(async () => {
      clickPosition = await page.evaluate((coordinate) => {
        const map = (globalThis as any).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        if (!Array.isArray(pixel) || pixel.length < 2) {
          return undefined;
        }
        return { x: pixel[0], y: pixel[1] };
      }, targetCoordinate);

      if (!clickPosition) {
        return undefined;
      }

      return `${Math.round(clickPosition.x)},${Math.round(clickPosition.y)}`;
    })
    .toMatch(/^-?\d+,-?\d+$/);

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();
  expect(clickPosition).toBeDefined();
  expect(clickPosition!.x).toBeGreaterThan(0);
  expect(clickPosition!.y).toBeGreaterThan(0);
  expect(clickPosition!.x).toBeLessThan(mapBox!.width);
  expect(clickPosition!.y).toBeLessThan(mapBox!.height);

  const getFeatureInfoResponsePromise = page.waitForResponse((response) => {
    return response.ok() && response.url().toLowerCase().includes('getfeatureinfo');
  });

  await mapContainer.click({
    position: {
      x: clickPosition!.x,
      y: clickPosition!.y
    }
  });

  await getFeatureInfoResponsePromise;

  await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
