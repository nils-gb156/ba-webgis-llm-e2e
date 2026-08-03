// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if (
        (await measurementPanel.isVisible()) ||
        (await measurementToggle.getAttribute('aria-pressed')) === 'true'
    ) {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(async () => {
            return await page.evaluate(([x, y]) => {
                const map = (window as any).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                if (!Array.isArray(pixel) || pixel.length < 2) {
                    return false;
                }
                return Number.isFinite(pixel[0]) && Number.isFinite(pixel[1]);
            }, targetCoordinate);
        })
        .toBe(true);

    const targetPixel = await page.evaluate(([x, y]) => {
        const map = (window as any).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        if (!Array.isArray(pixel) || pixel.length < 2) {
            return null;
        }
        return {
            x: Math.round(pixel[0]),
            y: Math.round(pixel[1])
        };
    }, targetCoordinate);

    expect(targetPixel).not.toBeNull();

    const featureInfoResponsePromise = page.waitForResponse(
        (response) => /getfeatureinfo/i.test(response.url()) && response.ok()
    );

    await mapContainer.click({
        position: {
            x: targetPixel!.x,
            y: targetPixel!.y
        }
    });

    await featureInfoResponsePromise;

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText(/UV-Index Station/i);
    await expect
        .poll(async () => ((await uviStationSection.textContent()) ?? '').trim().length)
        .toBeGreaterThan('UV-Index Station'.length);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText(/EUCOS Ground Station/i);
    await expect
        .poll(async () => ((await eucosStationSection.textContent()) ?? '').trim().length)
        .toBeGreaterThan('EUCOS Ground Station'.length);
});
