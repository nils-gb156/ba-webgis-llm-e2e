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
        return await page.evaluate((coordinate) => {
            const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coord: number[]) => number[] | undefined } } }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            return Array.isArray(pixel) && pixel.length >= 2 ? [pixel[0], pixel[1]] as [number, number] : undefined;
        }, targetCoordinate);
    };

    await expect
        .poll(async () => {
            const pixel = await getPixelForCoordinate();
            return pixel ? { x: pixel[0], y: pixel[1] } : undefined;
        })
        .not.toBeUndefined();

    const pixel = await getPixelForCoordinate();
    if (!pixel) {
        throw new Error('Could not determine map pixel for target coordinate.');
    }

    await mapContainer.click({
        position: {
            x: pixel[0],
            y: pixel[1]
        }
    });

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(uviStationInfo).toContainText(/\S/);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
    await expect(eucosStationInfo).toContainText(/\S/);
});
