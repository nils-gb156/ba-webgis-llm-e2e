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

    if (!(await infoPanel.isVisible())) {
        await page.getByTestId('info-panel-toggle').click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await page.getByTestId('measurement-toggle').click();
    }
    await expect(measurementPanel).not.toBeVisible();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const stationCoordinate: [number, number] = [1188692.84, 6767643.28];
    let clickPosition: { x: number; y: number } | undefined;

    await expect
        .poll(async () => {
            clickPosition = await page.evaluate(([x, y]) => {
                const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined } } }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                if (!Array.isArray(pixel) || pixel.length < 2) {
                    return undefined;
                }
                return {
                    x: Math.round(pixel[0]),
                    y: Math.round(pixel[1])
                };
            }, stationCoordinate);

            return (
                clickPosition !== undefined &&
                Number.isFinite(clickPosition.x) &&
                Number.isFinite(clickPosition.y)
            );
        })
        .toBe(true);

    await mapContainer.click({ position: clickPosition! });

    const uviSection = infoPanel.getByTestId('uvi-station-section');
    const eucosSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviSection).toBeVisible();
    await expect(uviSection).toContainText('UV-Index Station');
    await expect
        .poll(async () => ((await uviSection.textContent()) ?? '').trim().length)
        .toBeGreaterThan('UV-Index Station'.length);

    await expect(eucosSection).toBeVisible();
    await expect(eucosSection).toContainText('EUCOS Ground Station');
    await expect
        .poll(async () => ((await eucosSection.textContent()) ?? '').trim().length)
        .toBeGreaterThan('EUCOS Ground Station'.length);
});
