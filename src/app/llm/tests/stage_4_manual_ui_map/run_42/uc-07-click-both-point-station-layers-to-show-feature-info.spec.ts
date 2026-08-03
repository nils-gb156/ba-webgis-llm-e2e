// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('load');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const clickPositionHandle = await page.waitForFunction(
        ([x, y]: [number, number]) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (
                                coordinate: [number, number]
                            ) => [number, number] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);

            if (!pixel || pixel.length < 2) {
                return undefined;
            }

            const [pixelX, pixelY] = pixel;
            if (!Number.isFinite(pixelX) || !Number.isFinite(pixelY)) {
                return undefined;
            }

            return { x: pixelX, y: pixelY };
        },
        targetCoordinate
    );

    const clickPosition = await clickPositionHandle.jsonValue<{ x: number; y: number }>();
    await clickPositionHandle.dispose();

    const mapBounds = await mapContainer.boundingBox();
    if (!mapBounds) {
        throw new Error('The map container has no bounding box.');
    }

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThanOrEqual(mapBounds.width);
    expect(clickPosition.y).toBeLessThanOrEqual(mapBounds.height);

    await mapContainer.click({
        position: {
            x: clickPosition.x,
            y: clickPosition.y
        }
    });

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const uviStationInfo = infoPanel.getByTestId('uvi-station-info');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');
    const eucosStationInfo = infoPanel.getByTestId('eucos-station-info');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(uviStationInfo).toContainText(/\S/);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
    await expect(eucosStationInfo).toContainText(/\S/);
});
