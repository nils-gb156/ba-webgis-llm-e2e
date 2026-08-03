// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if (!(await layerSwitcher.isVisible())) {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });

    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    await expect(uviStationsCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const pixelHandle = await page.waitForFunction(
        ([x, y]) => {
            const map = (globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getPixelFromCoordinate?: (coordinate: [number, number]) => [number, number] | undefined;
                        getSize?: () => [number, number] | undefined;
                    };
                };
            }).__openPioneerMap;

            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            const size = map?.olMap?.getSize?.();

            if (!pixel || !size) {
                return null;
            }

            const [pixelX, pixelY] = pixel;
            const [width, height] = size;

            if (
                !Number.isFinite(pixelX) ||
                !Number.isFinite(pixelY) ||
                pixelX < 0 ||
                pixelY < 0 ||
                pixelX > width ||
                pixelY > height
            ) {
                return null;
            }

            return { x: pixelX, y: pixelY };
        },
        targetCoordinate
    );
    const clickPosition = (await pixelHandle.jsonValue()) as { x: number; y: number };

    await mapContainer.click({ position: clickPosition });

    const uviStationSection = page.getByTestId('uvi-station-section');
    const uviStationInfo = page.getByTestId('uvi-station-info');
    const eucosStationSection = page.getByTestId('eucos-station-section');
    const eucosStationInfo = page.getByTestId('eucos-station-info');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
});
