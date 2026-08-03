// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const uviStationSection = page.getByTestId('uvi-station-section');
    const uviStationInfo = page.getByTestId('uvi-station-info');
    const eucosStationSection = page.getByTestId('eucos-station-section');
    const eucosStationInfo = page.getByTestId('eucos-station-info');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return center?.length;
    }).toBe(2);

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect.poll(async () => {
        const pixel = await page.evaluate((coordinate) => {
            const map = (globalThis as any).__openPioneerMap;
            const rawPixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            const rect = map?.olMap?.getTargetElement?.()?.getBoundingClientRect?.();

            if (!Array.isArray(rawPixel) || rawPixel.length < 2 || !rect) {
                return false;
            }

            return (
                Number.isFinite(rawPixel[0]) &&
                Number.isFinite(rawPixel[1]) &&
                rawPixel[0] >= 0 &&
                rawPixel[1] >= 0 &&
                rawPixel[0] <= rect.width &&
                rawPixel[1] <= rect.height
            );
        }, targetCoordinate);

        return pixel;
    }).toBe(true);

    const targetPixel = await page.evaluate((coordinate) => {
        const map = (globalThis as any).__openPioneerMap;
        const rawPixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        const rect = map?.olMap?.getTargetElement?.()?.getBoundingClientRect?.();

        if (!Array.isArray(rawPixel) || rawPixel.length < 2 || !rect) {
            return undefined;
        }

        return {
            x: rawPixel[0],
            y: rawPixel[1],
            width: rect.width,
            height: rect.height
        };
    }, targetCoordinate);

    if (!targetPixel) {
        throw new Error('Could not convert the target map coordinate to a clickable pixel.');
    }

    expect(targetPixel.x).toBeGreaterThanOrEqual(0);
    expect(targetPixel.y).toBeGreaterThanOrEqual(0);
    expect(targetPixel.x).toBeLessThanOrEqual(targetPixel.width);
    expect(targetPixel.y).toBeLessThanOrEqual(targetPixel.height);

    await mapContainer.click({
        position: {
            x: Math.round(targetPixel.x),
            y: Math.round(targetPixel.y)
        }
    });

    await expect(infoPanel).toBeVisible();
    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
});
