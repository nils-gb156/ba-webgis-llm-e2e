// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

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

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    await expect(uviStationSection).toBeHidden();
    await expect(uviStationInfo).toBeHidden();
    await expect(eucosStationSection).toBeHidden();
    await expect(eucosStationInfo).toBeHidden();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getMapClickPosition = async (): Promise<{ x: number; y: number } | undefined> => {
        return page.evaluate((coordinate: [number, number]) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);

            if (!Array.isArray(pixel) || pixel.length < 2) {
                return undefined;
            }

            const [x, y] = pixel;
            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                return undefined;
            }

            return {
                x: Math.round(x),
                y: Math.round(y)
            };
        }, targetCoordinate);
    };

    await expect.poll(async () => {
        const position = await getMapClickPosition();
        return position ? `${position.x},${position.y}` : undefined;
    }).toMatch(/^-?\d+,-?\d+$/);

    const clickPosition = await getMapClickPosition();
    expect(clickPosition).toBeDefined();

    await mapContainer.click({ position: clickPosition! });

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(uviStationInfo).toContainText(/\S/);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
    await expect(eucosStationInfo).toContainText(/\S/);
});
