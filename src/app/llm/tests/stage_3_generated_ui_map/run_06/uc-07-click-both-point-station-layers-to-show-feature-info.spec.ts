// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(() =>
            page.evaluate(([x, y]) => {
                const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                return Array.isArray(pixel) && pixel.length >= 2
                    ? ([pixel[0], pixel[1]] as [number, number])
                    : undefined;
            }, targetCoordinate)
        )
        .not.toBeUndefined();

    const targetPixel = await page.evaluate(([x, y]) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        return Array.isArray(pixel) && pixel.length >= 2
            ? ([pixel[0], pixel[1]] as [number, number])
            : undefined;
    }, targetCoordinate);

    expect(targetPixel).toBeDefined();
    if (!targetPixel) {
        throw new Error('Could not resolve the target map coordinate to a click position.');
    }

    const [pixelX, pixelY] = targetPixel;
    const mapBox = await mapContainer.boundingBox();

    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    expect(pixelX).toBeGreaterThanOrEqual(0);
    expect(pixelY).toBeGreaterThanOrEqual(0);
    expect(pixelX).toBeLessThan(mapBox.width);
    expect(pixelY).toBeLessThan(mapBox.height);

    await mapContainer.click({
        position: {
            x: pixelX,
            y: pixelY
        }
    });

    await expect(infoPanel).toBeVisible();

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText('UV-Index Station');
    await expect
        .poll(async () => (await uviStationSection.textContent())?.trim().length ?? 0)
        .toBeGreaterThan('UV-Index Station'.length);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
    await expect
        .poll(async () => (await eucosStationSection.textContent())?.trim().length ?? 0)
        .toBeGreaterThan('EUCOS Ground Station'.length);
});
