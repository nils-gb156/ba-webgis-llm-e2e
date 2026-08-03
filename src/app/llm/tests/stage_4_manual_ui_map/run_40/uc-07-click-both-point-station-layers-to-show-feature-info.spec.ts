// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const uviStationSection = page.getByTestId('uvi-station-section');
    const uviStationInfo = page.getByTestId('uvi-station-info');
    const eucosStationSection = page.getByTestId('eucos-station-section');
    const eucosStationInfo = page.getByTestId('eucos-station-info');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const stationCoordinate: [number, number] = [1188692.84, 6767643.28];

    const coordinateIsClickable = async () =>
        page.evaluate(([x, y]) => {
            const map = (globalThis as any).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            const size = map?.olMap?.getSize?.();

            return Boolean(
                pixel &&
                    size &&
                    Number.isFinite(pixel[0]) &&
                    Number.isFinite(pixel[1]) &&
                    pixel[0] >= 0 &&
                    pixel[1] >= 0 &&
                    pixel[0] <= size[0] &&
                    pixel[1] <= size[1]
            );
        }, stationCoordinate);

    if (!(await coordinateIsClickable())) {
        await page.getByTestId('initial-extent-button').click();
    }

    await expect.poll(coordinateIsClickable).toBe(true);
    await expect
        .poll(() =>
            page.evaluate(() => {
                const map = (globalThis as any).__openPioneerMap;
                const view = map?.olMap?.getView?.();
                return !view?.getAnimating?.() && !view?.getInteracting?.();
            })
        )
        .toBe(true);

    const targetPixel = await page.evaluate(([x, y]) => {
        const map = (globalThis as any).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        return pixel ? { x: pixel[0], y: pixel[1] } : undefined;
    }, stationCoordinate);

    if (!targetPixel) {
        throw new Error('Could not determine a clickable pixel for the target station coordinate.');
    }

    const featureInfoRequests: string[] = [];
    page.on('request', (request) => {
        if (request.url().includes('GetFeatureInfo')) {
            featureInfoRequests.push(request.url());
        }
    });

    const featureInfoResponsePromise = page.waitForResponse(
        (response) =>
            response.url().includes('GetFeatureInfo') &&
            response.request().method() === 'GET' &&
            response.ok()
    );

    await mapContainer.click({
        position: {
            x: Math.round(targetPixel.x),
            y: Math.round(targetPixel.y)
        }
    });

    await featureInfoResponsePromise;
    await expect.poll(() => featureInfoRequests.length).toBeGreaterThan(0);

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
});
