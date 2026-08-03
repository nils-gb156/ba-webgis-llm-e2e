// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(async () => {
            const pixel = await page.evaluate((coordinate) => {
                const map = (globalThis as any).__openPioneerMap;
                const rawPixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
                return Array.isArray(rawPixel) && rawPixel.length >= 2
                    ? { x: Math.round(rawPixel[0]), y: Math.round(rawPixel[1]) }
                    : undefined;
            }, targetCoordinate);
            const box = await mapContainer.boundingBox();

            return Boolean(
                pixel &&
                    box &&
                    pixel.x > 0 &&
                    pixel.y > 0 &&
                    pixel.x < box.width &&
                    pixel.y < box.height
            );
        })
        .toBe(true);

    const clickPosition = await page.evaluate((coordinate) => {
        const map = (globalThis as any).__openPioneerMap;
        const rawPixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return Array.isArray(rawPixel) && rawPixel.length >= 2
            ? { x: Math.round(rawPixel[0]), y: Math.round(rawPixel[1]) }
            : undefined;
    }, targetCoordinate);

    expect(clickPosition).toBeTruthy();

    const getFeatureInfoResponse = page.waitForResponse(
        (response) => /getfeatureinfo/i.test(response.url()) && response.ok()
    );

    await mapContainer.click({ position: clickPosition! });
    await getFeatureInfoResponse;

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeVisible();
    await expect(eucosStationSection).toBeVisible();

    await expect
        .poll(
            async () =>
                ((await uviStationSection.textContent()) ?? '').trim().replace(/\s+/g, ' ').length
        )
        .toBeGreaterThan('UV-Index Station'.length);

    await expect
        .poll(
            async () =>
                ((await eucosStationSection.textContent()) ?? '')
                    .trim()
                    .replace(/\s+/g, ' ').length
        )
        .toBeGreaterThan('EUCOS Ground Station'.length);
});
