// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const infoPanel = page.getByTestId('info-panel');
    if (!(await infoPanel.isVisible())) {
        await page.getByTestId('info-panel-toggle').click();
    }
    await expect(infoPanel).toBeVisible();

    const measurementPanel = page.getByTestId('measurement-panel');
    if (await measurementPanel.isVisible()) {
        await page.getByTestId('measurement-toggle').click();
    }
    await expect(measurementPanel).toBeHidden();

    await page.getByTestId('initial-extent-button').click();

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    let targetClickPosition: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            targetClickPosition = await page.evaluate(() => {
                const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([1188692.84, 6767643.28]);
                const size = map?.olMap?.getSize?.();

                if (!Array.isArray(pixel) || pixel.length < 2) {
                    return undefined;
                }
                if (!Array.isArray(size) || size.length < 2) {
                    return undefined;
                }

                const [x, y] = pixel;
                const [width, height] = size;

                if (
                    typeof x !== 'number' ||
                    typeof y !== 'number' ||
                    typeof width !== 'number' ||
                    typeof height !== 'number' ||
                    x < 0 ||
                    y < 0 ||
                    x > width ||
                    y > height
                ) {
                    return undefined;
                }

                return {
                    x: Math.round(x),
                    y: Math.round(y)
                };
            });
            return targetClickPosition;
        })
        .not.toBeUndefined();

    await mapContainer.click({ position: targetClickPosition! });

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
