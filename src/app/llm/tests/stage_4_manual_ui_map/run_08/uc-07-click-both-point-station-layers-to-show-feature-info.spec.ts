// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

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

    const getClickPosition = async (): Promise<{ x: number; y: number } | undefined> =>
        page.evaluate(([x, y]) => {
            const map = (globalThis as any).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            const viewportRect = map?.olMap?.getViewport?.()?.getBoundingClientRect?.();
            const containerRect = document
                .querySelector('[data-testid="map-container"]')
                ?.getBoundingClientRect?.();

            if (!Array.isArray(pixel) || pixel.length < 2 || !viewportRect || !containerRect) {
                return undefined;
            }

            const relativeX = pixel[0] + viewportRect.left - containerRect.left;
            const relativeY = pixel[1] + viewportRect.top - containerRect.top;

            if (!Number.isFinite(relativeX) || !Number.isFinite(relativeY)) {
                return undefined;
            }

            return {
                x: Math.round(relativeX),
                y: Math.round(relativeY)
            };
        }, targetCoordinate);

    await expect
        .poll(async () => {
            const position = await getClickPosition();
            const box = await mapContainer.boundingBox();

            return Boolean(
                position &&
                    box &&
                    position.x >= 0 &&
                    position.y >= 0 &&
                    position.x <= box.width &&
                    position.y <= box.height
            );
        })
        .toBe(true);

    const clickPosition = await getClickPosition();
    if (!clickPosition) {
        throw new Error('Could not convert the target map coordinate into a clickable position.');
    }

    await mapContainer.click({ position: clickPosition });

    const uviStationSection = page.getByTestId('uvi-station-section');
    const uviStationInfo = page.getByTestId('uvi-station-info');
    const eucosStationSection = page.getByTestId('eucos-station-section');
    const eucosStationInfo = page.getByTestId('eucos-station-info');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
});
