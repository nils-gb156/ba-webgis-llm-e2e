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
    const uviStationInfo = page.getByTestId('uvi-station-info');
    const eucosStationSection = page.getByTestId('eucos-station-section');
    const eucosStationInfo = page.getByTestId('eucos-station-info');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    await expect(uviStationSection).toBeHidden();
    await expect(eucosStationSection).toBeHidden();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getPixelForCoordinate = async (): Promise<[number, number] | undefined> => {
        return await page.evaluate(([x, y]) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            return Array.isArray(pixel) &&
                pixel.length >= 2 &&
                Number.isFinite(pixel[0]) &&
                Number.isFinite(pixel[1])
                ? [pixel[0], pixel[1]]
                : undefined;
        }, targetCoordinate);
    };

    await expect.poll(async () => (await getPixelForCoordinate()) !== undefined).toBe(true);

    const targetPixel = await getPixelForCoordinate();
    expect(targetPixel).toBeDefined();
    if (!targetPixel) {
        throw new Error('Target map coordinate could not be converted to a screen pixel.');
    }

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    expect(targetPixel[0]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[1]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[0]).toBeLessThanOrEqual(mapBox.width);
    expect(targetPixel[1]).toBeLessThanOrEqual(mapBox.height);

    await mapContainer.click({
        position: {
            x: targetPixel[0],
            y: targetPixel[1]
        }
    });

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(uviStationInfo).toContainText(/\S+/);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
    await expect(eucosStationInfo).toContainText(/\S+/);
});
