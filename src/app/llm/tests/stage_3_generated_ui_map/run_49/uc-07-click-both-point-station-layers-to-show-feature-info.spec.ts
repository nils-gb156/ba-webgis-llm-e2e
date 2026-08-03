// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementPanel).toBeHidden();

    await expect
        .poll(async () => {
            const zoom = await getMapZoomLevel(page);
            const center = await getMapCenter(page);
            return zoom !== undefined && center !== undefined;
        })
        .toBe(true);

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const bbox = await mapContainer.boundingBox();
    expect(bbox).not.toBeNull();

    const zoom = await getMapZoomLevel(page);
    const center = await getMapCenter(page);

    if (bbox == null || zoom === undefined || center === undefined) {
        throw new Error('Map was not ready for coordinate-based clicking.');
    }

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const initialResolution = 156543.03392804097;
    const resolution = initialResolution / Math.pow(2, zoom);

    const clickPosition = {
        x: Math.round(bbox.width / 2 + (targetCoordinate[0] - center[0]) / resolution),
        y: Math.round(bbox.height / 2 - (targetCoordinate[1] - center[1]) / resolution)
    };

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThanOrEqual(Math.round(bbox.width));
    expect(clickPosition.y).toBeLessThanOrEqual(Math.round(bbox.height));

    await mapContainer.click({ position: clickPosition });

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText('UV-Index Station');

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
});
