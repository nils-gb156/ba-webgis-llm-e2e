// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    if (!(await infoPanel.isVisible())) {
        await page.getByTestId('info-panel-toggle').click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await page.getByTestId('measurement-toggle').click();
    }
    await expect(measurementPanel).toBeHidden();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    let clickPosition: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            clickPosition = await page.evaluate((coordinate) => {
                const map = (globalThis as any).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
                return Array.isArray(pixel) && pixel.length >= 2
                    ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
                    : undefined;
            }, targetCoordinate);
            return clickPosition;
        })
        .not.toBeUndefined();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox || !clickPosition) {
        throw new Error('Map viewport or click position is not available.');
    }

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThanOrEqual(mapBox.width);
    expect(clickPosition.y).toBeLessThanOrEqual(mapBox.height);

    await mapContainer.click({ position: clickPosition });

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText('UV-Index Station');

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
});
