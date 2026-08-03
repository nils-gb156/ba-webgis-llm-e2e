// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    if (!(await infoPanel.isVisible())) {
        const pressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');
    if (await measurementPanel.isVisible()) {
        const pressed = await measurementToggle.getAttribute('aria-pressed');
        if (pressed !== 'false') {
            await measurementToggle.click();
        }
    }
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const stationCoordinate: [number, number] = [1188692.84, 6767643.28];
    let stationPixel: [number, number] | undefined;

    await expect
        .poll(async () => {
            stationPixel = await page.evaluate((coordinate: [number, number]) => {
                const map = (
                    globalThis as typeof globalThis & {
                        __openPioneerMap?: {
                            olMap?: {
                                getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
                            };
                        };
                    }
                ).__openPioneerMap;

                const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
                return Array.isArray(pixel) && pixel.length >= 2
                    ? ([Math.round(pixel[0]), Math.round(pixel[1])] as [number, number])
                    : undefined;
            }, stationCoordinate);

            return stationPixel;
        })
        .toBeTruthy();

    if (!stationPixel) {
        throw new Error('Could not resolve map pixel for station coordinate.');
    }

    await page.getByTestId('map-container').click({
        position: { x: stationPixel[0], y: stationPixel[1] }
    });

    const uviStationSection = page.getByTestId('uvi-station-section');
    const eucosStationSection = page.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText('UV-Index Station');
    await expect.poll(async () => (await uviStationSection.textContent())?.trim() ?? '').toMatch(/\S+/);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
    await expect.poll(async () => (await eucosStationSection.textContent())?.trim() ?? '').toMatch(/\S+/);
});
