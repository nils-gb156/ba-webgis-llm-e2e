// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const uviStationSection = page.getByTestId('uvi-station-section');
    const eucosStationSection = page.getByTestId('eucos-station-section');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect.poll(async () => {
        const position = await page.evaluate((coordinate) => {
            const map = (globalThis as any).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            return Array.isArray(pixel) && pixel.length >= 2
                ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
                : undefined;
        }, targetCoordinate);
        return position ? 'ready' : 'pending';
    }).toBe('ready');

    const clickPosition = await page.evaluate((coordinate) => {
        const map = (globalThis as any).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return Array.isArray(pixel) && pixel.length >= 2
            ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
            : undefined;
    }, targetCoordinate);

    expect(clickPosition).toBeDefined();
    if (!clickPosition) {
        throw new Error('Could not determine map pixel for the target coordinate.');
    }

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThanOrEqual(mapBox.width);
    expect(clickPosition.y).toBeLessThanOrEqual(mapBox.height);

    await mapContainer.click({ position: clickPosition });

    await expect(uviStationSection).toBeVisible();
    await expect(eucosStationSection).toBeVisible();

    await expect.poll(async () => (await uviStationSection.textContent())?.trim().length ?? 0).toBeGreaterThan('UV-Index Station'.length);
    await expect.poll(async () => (await eucosStationSection.textContent())?.trim().length ?? 0).toBeGreaterThan('EUCOS Ground Station'.length);
});
