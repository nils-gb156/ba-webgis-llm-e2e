// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');
    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const featureInfoRequests: string[] = [];
    page.on('request', (request) => {
        if (/getfeatureinfo/i.test(request.url())) {
            featureInfoRequests.push(request.url());
        }
    });

    let clickPosition: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            clickPosition = await page.evaluate(([x, y]) => {
                const map = (globalThis as any).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                if (!Array.isArray(pixel) || pixel.length < 2) {
                    return undefined;
                }

                const [pixelX, pixelY] = pixel;
                if (typeof pixelX !== 'number' || typeof pixelY !== 'number') {
                    return undefined;
                }

                return { x: Math.round(pixelX), y: Math.round(pixelY) };
            }, targetCoordinate);

            return clickPosition ? `${clickPosition.x},${clickPosition.y}` : undefined;
        })
        .toMatch(/^-?\d+,-?\d+$/);

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    expect(clickPosition).toBeDefined();
    expect(clickPosition!.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition!.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition!.x).toBeLessThanOrEqual(mapBox!.width);
    expect(clickPosition!.y).toBeLessThanOrEqual(mapBox!.height);

    await mapContainer.click({ position: clickPosition! });

    await expect.poll(() => featureInfoRequests.length).toBeGreaterThan(0);

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText('UV-Index Station');
    await expect
        .poll(async () => ((await uviStationSection.textContent()) ?? '').replace(/\s+/g, ' ').trim().length)
        .toBeGreaterThan('UV-Index Station'.length + 1);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
    await expect
        .poll(async () => ((await eucosStationSection.textContent()) ?? '').replace(/\s+/g, ' ').trim().length)
        .toBeGreaterThan('EUCOS Ground Station'.length + 1);
});
