// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    if (!(await infoPanel.isVisible())) {
        const infoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (infoPanelPressed !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
        if (measurementPressed === 'true') {
            await measurementToggle.click();
        }
    }
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    await page.getByTestId('initial-extent-button').click();

    await expect.poll(async () => {
        return await page.evaluate((coordinate) => {
            const map = (globalThis as any).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            const size = map?.olMap?.getSize?.();
            return !!pixel && !!size && pixel[0] >= 0 && pixel[1] >= 0 && pixel[0] <= size[0] && pixel[1] <= size[1];
        }, targetCoordinate);
    }).toBe(true);

    const clickPosition = await page.evaluate((coordinate) => {
        const map = (globalThis as any).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return pixel ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) } : undefined;
    }, targetCoordinate);

    if (!clickPosition) {
        throw new Error('Could not determine map click position for the target coordinate.');
    }

    const getFeatureInfoResponsePromise = page.waitForResponse((response) => {
        return response.request().method() === 'GET' && response.url().includes('GetFeatureInfo');
    });

    await mapContainer.click({ position: clickPosition });

    const getFeatureInfoResponse = await getFeatureInfoResponsePromise;
    expect(getFeatureInfoResponse.ok()).toBeTruthy();

    const uviStationSection = page.getByTestId('uvi-station-section');
    const eucosStationSection = page.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeVisible();
    await expect(eucosStationSection).toBeVisible();

    await expect.poll(async () => ((await uviStationSection.textContent()) ?? '').trim()).toMatch(/UV-Index Station.+/s);
    await expect.poll(async () => ((await eucosStationSection.textContent()) ?? '').trim()).toMatch(/EUCOS Ground Station.+/s);
});
