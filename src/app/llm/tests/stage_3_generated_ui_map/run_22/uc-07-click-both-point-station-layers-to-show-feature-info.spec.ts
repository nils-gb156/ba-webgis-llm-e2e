// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    if (!(await infoPanel.isVisible())) {
        await page.getByTestId('info-panel-toggle').click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await page.getByTestId('measurement-toggle').click();
    }
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await page.waitForFunction(([x, y]) => {
        const map = (globalThis as {
            __openPioneerMap?: {
                olMap?: { getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined };
            };
        }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        return (
            Array.isArray(pixel) &&
            pixel.length >= 2 &&
            Number.isFinite(pixel[0]) &&
            Number.isFinite(pixel[1])
        );
    }, targetCoordinate);

    const pixel = await page.evaluate(([x, y]) => {
        const map = (globalThis as {
            __openPioneerMap?: {
                olMap?: { getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined };
            };
        }).__openPioneerMap;
        const result = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        return result ? ([Math.round(result[0]), Math.round(result[1])] as [number, number]) : undefined;
    }, targetCoordinate);

    expect(pixel).toBeDefined();
    if (!pixel) {
        throw new Error('Could not determine the pixel position for the target map coordinate.');
    }

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    expect(pixel[0]).toBeGreaterThanOrEqual(0);
    expect(pixel[1]).toBeGreaterThanOrEqual(0);
    expect(pixel[0]).toBeLessThanOrEqual(Math.round(mapBox.width));
    expect(pixel[1]).toBeLessThanOrEqual(Math.round(mapBox.height));

    const getFeatureInfoResponse = page.waitForResponse((response) => {
        return response.ok() && response.url().toLowerCase().includes('getfeatureinfo');
    });

    await mapContainer.click({ position: { x: pixel[0], y: pixel[1] } });
    await getFeatureInfoResponse;

    const uviSection = infoPanel.getByTestId('uvi-station-section');
    const eucosSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviSection).toBeVisible();
    await expect(uviSection).toContainText('UV-Index Station');
    await expect(uviSection).not.toHaveText(/^UV-Index Station\s*$/);

    await expect(eucosSection).toBeVisible();
    await expect(eucosSection).toContainText('EUCOS Ground Station');
    await expect(eucosSection).not.toHaveText(/^EUCOS Ground Station\s*$/);
});
