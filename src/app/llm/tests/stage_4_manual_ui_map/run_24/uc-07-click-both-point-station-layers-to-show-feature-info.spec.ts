// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(() =>
            page.evaluate((coord: [number, number]) => {
                const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coordinate: number[]) => number[] | undefined; getSize?: () => number[] | undefined } } })
                    .__openPioneerMap;
                const olMap = map?.olMap;
                const pixel = olMap?.getPixelFromCoordinate?.(coord);
                const size = olMap?.getSize?.();

                if (!pixel || !size || pixel.length < 2 || size.length < 2) {
                    return undefined;
                }

                if (pixel[0] < 0 || pixel[1] < 0 || pixel[0] > size[0] || pixel[1] > size[1]) {
                    return undefined;
                }

                return {
                    x: Math.round(pixel[0]),
                    y: Math.round(pixel[1])
                };
            }, targetCoordinate)
        )
        .not.toBeUndefined();

    const targetPixel = await page.evaluate((coord: [number, number]) => {
        const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coordinate: number[]) => number[] | undefined; getSize?: () => number[] | undefined } } })
            .__openPioneerMap;
        const olMap = map?.olMap;
        const pixel = olMap?.getPixelFromCoordinate?.(coord);
        const size = olMap?.getSize?.();

        if (!pixel || !size || pixel.length < 2 || size.length < 2) {
            return undefined;
        }

        if (pixel[0] < 0 || pixel[1] < 0 || pixel[0] > size[0] || pixel[1] > size[1]) {
            return undefined;
        }

        return {
            x: Math.round(pixel[0]),
            y: Math.round(pixel[1])
        };
    }, targetCoordinate);

    if (!targetPixel) {
        throw new Error('Target map coordinate is not clickable in the current viewport.');
    }

    await mapContainer.click({
        position: {
            x: targetPixel.x,
            y: targetPixel.y
        }
    });

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const uviStationInfo = infoPanel.getByTestId('uvi-station-info');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');
    const eucosStationInfo = infoPanel.getByTestId('eucos-station-info');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
});
