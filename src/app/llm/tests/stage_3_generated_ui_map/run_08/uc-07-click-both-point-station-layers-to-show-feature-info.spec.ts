// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');
    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    await expect.poll(async () => {
        return await page.evaluate(([x, y]) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            const size = map?.olMap?.getSize?.();

            if (!pixel || !size) {
                return false;
            }

            return (
                Number.isFinite(pixel[0]) &&
                Number.isFinite(pixel[1]) &&
                pixel[0] >= 0 &&
                pixel[1] >= 0 &&
                pixel[0] <= size[0] &&
                pixel[1] <= size[1]
            );
        }, targetCoordinate);
    }).toBe(true);

    const pixel = await page.evaluate(([x, y]) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const mapPixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);

        if (!mapPixel) {
            return undefined;
        }

        return {
            x: Math.round(mapPixel[0]),
            y: Math.round(mapPixel[1])
        };
    }, targetCoordinate);

    expect(pixel).toBeDefined();
    if (!pixel) {
        throw new Error('Target coordinate could not be converted to a map pixel.');
    }

    await mapContainer.click({
        position: {
            x: pixel.x,
            y: pixel.y
        }
    });

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText('UV-Index Station');
    await expect.poll(async () => ((await uviStationSection.textContent()) ?? '').trim().length).toBeGreaterThan('UV-Index Station'.length);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
    await expect.poll(async () => ((await eucosStationSection.textContent()) ?? '').trim().length).toBeGreaterThan('EUCOS Ground Station'.length);
});
