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
    const uviStationSection = page.getByTestId('uvi-station-section');
    const eucosStationSection = page.getByTestId('eucos-station-section');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const infoPanelVisible = await infoPanel.isVisible();
    const infoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (!infoPanelVisible && infoPanelPressed !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    let clickPosition: { x: number; y: number } | undefined;

    await expect
        .poll(async () => {
            clickPosition = await page.evaluate(([x, y]) => {
                const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);

                if (!Array.isArray(pixel) || pixel.length < 2) {
                    return undefined;
                }

                const [px, py] = pixel;
                if (!Number.isFinite(px) || !Number.isFinite(py)) {
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
        throw new Error('Could not determine a clickable pixel position for the target map coordinate.');
    }

    const getFeatureInfoResponse = page.waitForResponse(
        response => response.ok() && /getfeatureinfo/i.test(response.url())
    );

    await Promise.all([
        getFeatureInfoResponse,
        mapContainer.click({ position: clickPosition })
    ]);

    await expect(uviStationSection).toBeVisible();
    await expect(eucosStationSection).toBeVisible();
    await expect(uviStationSection).toContainText(/UV-Index Station/i);
    await expect(eucosStationSection).toContainText(/EUCOS Ground Station/i);

    await expect
        .poll(async () => ((await uviStationSection.textContent()) ?? '').replace(/\s+/g, ' ').trim())
        .toMatch(/UV-Index Station\b.+/i);

    await expect
        .poll(async () => ((await eucosStationSection.textContent()) ?? '').replace(/\s+/g, ' ').trim())
        .toMatch(/EUCOS Ground Station\b.+/i);
});
