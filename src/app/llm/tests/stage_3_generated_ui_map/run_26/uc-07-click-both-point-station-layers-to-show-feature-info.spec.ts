// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const uviStationSection = page.getByTestId('uvi-station-section');
    const eucosStationSection = page.getByTestId('eucos-station-section');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await page.waitForFunction((coordinate) => {
        const map = (globalThis as {
            __openPioneerMap?: {
                olMap?: {
                    getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
                    getSize?: () => number[] | undefined;
                };
            };
        }).__openPioneerMap;

        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        const size = map?.olMap?.getSize?.();

        return (
            Array.isArray(pixel) &&
            pixel.length >= 2 &&
            Array.isArray(size) &&
            size.length >= 2 &&
            pixel[0] >= 0 &&
            pixel[1] >= 0 &&
            pixel[0] <= size[0] &&
            pixel[1] <= size[1]
        );
    }, targetCoordinate);

    const pixel = await page.evaluate((coordinate) => {
        const map = (globalThis as {
            __openPioneerMap?: {
                olMap?: {
                    getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
                };
            };
        }).__openPioneerMap;

        const rawPixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        if (!Array.isArray(rawPixel) || rawPixel.length < 2) {
            return undefined;
        }

        return [rawPixel[0], rawPixel[1]] as [number, number];
    }, targetCoordinate);

    expect(pixel).toBeDefined();

    const featureInfoResponsePromise = page.waitForResponse(
        (response) => /getfeatureinfo/i.test(response.url()) && response.ok()
    );

    await mapContainer.click({
        position: {
            x: Math.round(pixel![0]),
            y: Math.round(pixel![1])
        }
    });

    await featureInfoResponsePromise;

    await expect(infoPanel).toBeVisible();

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText(/UV-Index Station/i);
    await expect
        .poll(async () => ((await uviStationSection.textContent()) ?? '').trim().length)
        .toBeGreaterThan('UV-Index Station'.length);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText(/EUCOS Ground Station/i);
    await expect
        .poll(async () => ((await eucosStationSection.textContent()) ?? '').trim().length)
        .toBeGreaterThan('EUCOS Ground Station'.length);
});
