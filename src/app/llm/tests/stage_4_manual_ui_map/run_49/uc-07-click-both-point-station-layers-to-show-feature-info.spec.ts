// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await page.getByTestId('info-panel-toggle').click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await page.getByTestId('measurement-toggle').click();
    }
    await expect(measurementPanel).toBeHidden();

    await expect.poll(async () => (await getMapZoomLevel(page)) ?? -1).toBeGreaterThan(-1);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getTargetPixel = async (): Promise<[number, number] | undefined> => {
        return await page.evaluate((coordinate) => {
            const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: [number, number]) => number[] | undefined } } }).__openPioneerMap;
            const pixel = map?.olMap.getPixelFromCoordinate(coordinate);
            return Array.isArray(pixel) && pixel.length >= 2 && Number.isFinite(pixel[0]) && Number.isFinite(pixel[1])
                ? [Math.round(pixel[0]), Math.round(pixel[1])]
                : undefined;
        }, targetCoordinate);
    };

    await expect.poll(async () => (await getTargetPixel())?.length ?? 0).toBe(2);

    const targetPixel = await getTargetPixel();
    const mapBox = await mapContainer.boundingBox();

    expect(targetPixel).toBeDefined();
    expect(mapBox).not.toBeNull();

    if (!targetPixel || !mapBox) {
        throw new Error('Could not determine a clickable pixel position for the target map coordinate.');
    }

    expect(targetPixel[0]).toBeGreaterThan(0);
    expect(targetPixel[1]).toBeGreaterThan(0);
    expect(targetPixel[0]).toBeLessThan(mapBox.width);
    expect(targetPixel[1]).toBeLessThan(mapBox.height);

    await mapContainer.click({
        position: {
            x: targetPixel[0],
            y: targetPixel[1]
        }
    });

    const uviStationSection = page.getByTestId('uvi-station-section');
    const uviStationInfo = page.getByTestId('uvi-station-info');
    const eucosStationSection = page.getByTestId('eucos-station-section');
    const eucosStationInfo = page.getByTestId('eucos-station-info');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(uviStationInfo).toContainText(/\S+/);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
    await expect(eucosStationInfo).toContainText(/\S+/);
});
