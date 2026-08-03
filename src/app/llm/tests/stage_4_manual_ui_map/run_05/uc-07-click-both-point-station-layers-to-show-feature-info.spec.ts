// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const uviSection = page.getByTestId('uvi-station-section');
    const uviInfo = page.getByTestId('uvi-station-info');
    const eucosSection = page.getByTestId('eucos-station-section');
    const eucosInfo = page.getByTestId('eucos-station-info');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect(uviSection).toBeHidden();
    await expect(eucosSection).toBeHidden();

    await expect.poll(() => getMapCenter(page)).toBeDefined();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect.poll(() =>
        page.evaluate((coordinate: [number, number]) => {
            const map = (globalThis as any).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            return Array.isArray(pixel) && pixel.length >= 2
                ? { x: pixel[0], y: pixel[1] }
                : undefined;
        }, targetCoordinate)
    ).toBeTruthy();

    const clickPixel = await page.evaluate((coordinate: [number, number]) => {
        const map = (globalThis as any).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return Array.isArray(pixel) && pixel.length >= 2
            ? { x: pixel[0], y: pixel[1] }
            : undefined;
    }, targetCoordinate);

    if (!clickPixel) {
        throw new Error('Could not convert target map coordinate to a clickable pixel position.');
    }

    await mapContainer.click({
        position: {
            x: clickPixel.x,
            y: clickPixel.y
        }
    });

    await expect(infoPanel).toBeVisible();
    await expect(uviSection).toBeVisible();
    await expect(uviInfo).toBeVisible();
    await expect(eucosSection).toBeVisible();
    await expect(eucosInfo).toBeVisible();
});
