// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    await expect(mapContainer).toBeVisible();

    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    if (!(await layerSwitcher.isVisible())) {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();

    const uviCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });

    if (!(await isLayerRendered(page, 'UV-Index Stations'))) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    if (!(await isLayerRendered(page, 'EUCOS Ground Stations'))) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(async () => {
            return await page.evaluate((coordinate) => {
                const map = (globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
                        };
                    };
                }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
                return (
                    Array.isArray(pixel) &&
                    pixel.length >= 2 &&
                    Number.isFinite(pixel[0]) &&
                    Number.isFinite(pixel[1])
                );
            }, targetCoordinate);
        })
        .toBe(true);

    const pixel = await page.evaluate((coordinate) => {
        const map = (globalThis as {
            __openPioneerMap?: {
                olMap?: {
                    getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
                };
            };
        }).__openPioneerMap;
        const result = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return Array.isArray(result) && result.length >= 2
            ? { x: Math.round(result[0]), y: Math.round(result[1]) }
            : undefined;
    }, targetCoordinate);

    expect(pixel).toBeDefined();

    const featureInfoResponse = page.waitForResponse(
        (response) => response.url().includes('GetFeatureInfo') && response.ok()
    );

    await mapContainer.click({
        position: {
            x: pixel!.x,
            y: pixel!.y
        }
    });

    await featureInfoResponse;

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const uviStationInfo = infoPanel.getByTestId('uvi-station-info');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');
    const eucosStationInfo = infoPanel.getByTestId('eucos-station-info');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
});
