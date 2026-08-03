// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');
    const uviStationSection = page.getByTestId('uvi-station-section');
    const eucosStationSection = page.getByTestId('eucos-station-section');

    const getPixelForCoordinate = async (
        coordinate: [number, number]
    ): Promise<[number, number] | undefined> => {
        return await page.evaluate(([x, y]) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap: {
                            getPixelFromCoordinate: (
                                coordinate: [number, number]
                            ) => number[] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;
            const pixel = map?.olMap.getPixelFromCoordinate([x, y]);
            return Array.isArray(pixel) && pixel.length >= 2
                ? ([Math.round(pixel[0]), Math.round(pixel[1])] as [number, number])
                : undefined;
        }, coordinate);
    };

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
            await measurementToggle.click();
        }
    }
    await expect(measurementPanel).toBeHidden();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect.poll(() => getPixelForCoordinate(targetCoordinate)).not.toBeUndefined();
    const targetPixel = await getPixelForCoordinate(targetCoordinate);

    expect(targetPixel).toBeDefined();
    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    if (!targetPixel || !mapBox) {
        throw new Error('Could not determine a clickable map pixel for the target coordinate.');
    }

    expect(targetPixel[0]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[1]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[0]).toBeLessThanOrEqual(mapBox.width);
    expect(targetPixel[1]).toBeLessThanOrEqual(mapBox.height);

    await mapContainer.click({
        position: {
            x: targetPixel[0],
            y: targetPixel[1]
        }
    });

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText('UV-Index Station');

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
});
