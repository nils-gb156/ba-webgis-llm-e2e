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

    const stationCoordinate: [number, number] = [1188692.84, 6767643.28];
    let targetPixel: [number, number] | undefined;

    await expect
        .poll(async () => {
            targetPixel = await page.evaluate((coordinate) => {
                const map = (globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
                        };
                    };
                }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
                return Array.isArray(pixel) && pixel.length >= 2
                    ? ([pixel[0], pixel[1]] as [number, number])
                    : undefined;
            }, stationCoordinate);
            return targetPixel;
        })
        .not.toBeUndefined();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    expect(targetPixel).toBeDefined();

    expect(targetPixel![0]).toBeGreaterThanOrEqual(0);
    expect(targetPixel![1]).toBeGreaterThanOrEqual(0);
    expect(targetPixel![0]).toBeLessThan(mapBox!.width);
    expect(targetPixel![1]).toBeLessThan(mapBox!.height);

    await mapContainer.click({
        position: {
            x: Math.floor(targetPixel![0]),
            y: Math.floor(targetPixel![1])
        }
    });

    await expect(page.getByTestId('uvi-station-section')).toBeVisible();
    await expect(page.getByTestId('uvi-station-info')).toBeVisible();
    await expect(page.getByTestId('eucos-station-section')).toBeVisible();
    await expect(page.getByTestId('eucos-station-info')).toBeVisible();
});
