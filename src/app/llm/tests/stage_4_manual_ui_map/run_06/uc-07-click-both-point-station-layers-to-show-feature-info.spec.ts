// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const uviStationSection = page.getByTestId('uvi-station-section');
    const uviStationInfo = page.getByTestId('uvi-station-info');
    const eucosStationSection = page.getByTestId('eucos-station-section');
    const eucosStationInfo = page.getByTestId('eucos-station-info');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    await expect(uviStationSection).toBeHidden();
    await expect(eucosStationSection).toBeHidden();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    let clickPixel: { x: number; y: number } | undefined;

    await expect
        .poll(async () => {
            clickPixel = await page.evaluate((coordinate) => {
                const map = (globalThis as {
                    __openPioneerMap?: {
                        olMap: {
                            getPixelFromCoordinate: (coord: [number, number]) => number[] | undefined;
                        };
                    };
                }).__openPioneerMap;
                const pixel = map?.olMap.getPixelFromCoordinate(coordinate);
                return Array.isArray(pixel) && pixel.length >= 2
                    ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
                    : undefined;
            }, targetCoordinate);
            return clickPixel;
        })
        .toBeTruthy();

    if (!clickPixel) {
        throw new Error('Could not resolve map pixel for target coordinate.');
    }

    const getFeatureInfoResponse = page.waitForResponse(
        (response) => /getfeatureinfo/i.test(response.url()) && response.ok()
    );

    await mapContainer.click({
        position: {
            x: clickPixel.x,
            y: clickPixel.y
        }
    });

    await getFeatureInfoResponse;

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(uviStationInfo).toContainText(/\S/);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
    await expect(eucosStationInfo).toContainText(/\S/);
});
