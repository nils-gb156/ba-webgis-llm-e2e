// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    let clickPosition: { x: number; y: number } | undefined;

    await expect
        .poll(async () => {
            clickPosition = await page.evaluate(([x, y]) => {
                const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
                const olMap = map?.olMap;
                const pixel = olMap?.getPixelFromCoordinate?.([x, y]);
                const size = olMap?.getSize?.();

                if (!Array.isArray(pixel) || pixel.length < 2) {
                    return undefined;
                }
                if (!Array.isArray(size) || size.length < 2) {
                    return undefined;
                }

                const [px, py] = pixel;
                const [width, height] = size;

                if (
                    typeof px !== 'number' ||
                    typeof py !== 'number' ||
                    typeof width !== 'number' ||
                    typeof height !== 'number'
                ) {
                    return undefined;
                }

                if (px < 0 || py < 0 || px > width || py > height) {
                    return undefined;
                }

                return {
                    x: Math.round(px),
                    y: Math.round(py)
                };
            }, targetCoordinate);

            return clickPosition !== undefined;
        })
        .toBe(true);

    if (!clickPosition) {
        throw new Error('Could not resolve a clickable map position for the target coordinate.');
    }

    await mapContainer.click({ position: clickPosition });

    await expect(page.getByTestId('uvi-station-section')).toBeVisible();
    await expect(page.getByTestId('uvi-station-info')).toBeVisible();
    await expect(page.getByTestId('eucos-station-section')).toBeVisible();
    await expect(page.getByTestId('eucos-station-info')).toBeVisible();
});
