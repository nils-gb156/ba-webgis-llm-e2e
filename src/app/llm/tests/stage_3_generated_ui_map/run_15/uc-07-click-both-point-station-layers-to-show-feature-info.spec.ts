// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

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

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeHidden();
    await expect(eucosStationSection).toBeHidden();

    const getTargetPixel = async (): Promise<{ x: number; y: number } | undefined> => {
        return await page.evaluate(([x, y]) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            if (!Array.isArray(pixel) || pixel.length < 2) {
                return undefined;
            }

            const [px, py] = pixel;
            if (!Number.isFinite(px) || !Number.isFinite(py)) {
                return undefined;
            }

            return { x: Math.round(px), y: Math.round(py) };
        }, targetCoordinate);
    };

    await expect.poll(() => getTargetPixel()).toBeTruthy();

    const targetPixel = await getTargetPixel();
    if (!targetPixel) {
        throw new Error('Could not calculate map pixel for the target coordinate.');
    }

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    expect(targetPixel.x).toBeGreaterThanOrEqual(0);
    expect(targetPixel.y).toBeGreaterThanOrEqual(0);
    expect(targetPixel.x).toBeLessThanOrEqual(Math.round(mapBox.width));
    expect(targetPixel.y).toBeLessThanOrEqual(Math.round(mapBox.height));

    await mapContainer.click({
        position: {
            x: targetPixel.x,
            y: targetPixel.y
        }
    });

    await expect(uviStationSection).toBeVisible();
    await expect(eucosStationSection).toBeVisible();
});
