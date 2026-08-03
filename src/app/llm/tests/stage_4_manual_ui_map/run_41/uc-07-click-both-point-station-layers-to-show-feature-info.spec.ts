// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const uviStationSection = page.getByTestId('uvi-station-section');
    const uviStationInfo = page.getByTestId('uvi-station-info');
    const eucosStationSection = page.getByTestId('eucos-station-section');
    const eucosStationInfo = page.getByTestId('eucos-station-info');

    await expect(mapContainer).toBeVisible();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(() =>
            page.evaluate((coordinate) => {
                const map = (globalThis as any).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
                return Array.isArray(pixel) && pixel.length >= 2
                    ? [Math.round(pixel[0]), Math.round(pixel[1])]
                    : undefined;
            }, targetCoordinate)
        )
        .not.toBeUndefined();

    const pixel = await page.evaluate((coordinate) => {
        const map = (globalThis as any).__openPioneerMap;
        const mapPixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return Array.isArray(mapPixel) && mapPixel.length >= 2
            ? [Math.round(mapPixel[0]), Math.round(mapPixel[1])]
            : undefined;
    }, targetCoordinate);

    expect(pixel).toBeDefined();

    const [x, y] = pixel!;
    const mapContainerSize = await mapContainer.evaluate((element) => ({
        width: element.clientWidth,
        height: element.clientHeight
    }));

    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(mapContainerSize.width);
    expect(y).toBeLessThan(mapContainerSize.height);

    await mapContainer.click({ position: { x, y } });

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
});
