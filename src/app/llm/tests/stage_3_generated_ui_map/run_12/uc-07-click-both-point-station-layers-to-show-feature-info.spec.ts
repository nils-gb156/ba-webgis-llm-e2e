// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

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

    const getClickPosition = async (): Promise<{ x: number; y: number } | undefined> => {
        return page.evaluate((coordinate) => {
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

            if (!pixel || !size || pixel.length < 2 || size.length < 2) {
                return undefined;
            }

            const [x, y] = pixel;
            const [width, height] = size;

            if (![x, y, width, height].every((value) => Number.isFinite(value))) {
                return undefined;
            }

            if (x < 0 || y < 0 || x > width || y > height) {
                return undefined;
            }

            return {
                x: Math.round(x),
                y: Math.round(y)
            };
        }, targetCoordinate);
    };

    await expect.poll(async () => {
        const position = await getClickPosition();
        return position ? 'ready' : undefined;
    }).toBe('ready');

    const clickPosition = await getClickPosition();
    expect(clickPosition).toBeDefined();

    if (!clickPosition) {
        throw new Error('Target coordinate is not within the current map view.');
    }

    const featureInfoResponse = page.waitForResponse((response) => {
        return response.ok() && /getfeatureinfo/i.test(response.url());
    });

    await Promise.all([
        featureInfoResponse,
        mapContainer.click({ position: clickPosition })
    ]);

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText(/UV-Index Station/i);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText(/EUCOS Ground Station/i);
});
