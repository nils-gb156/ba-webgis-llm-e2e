// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    if (!(await infoPanel.isVisible())) {
        await page.getByTestId('info-panel-toggle').click();
    }
    await expect(infoPanel).toBeVisible();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeHidden();
    await expect(eucosStationSection).toBeHidden();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getPixelForCoordinate = async (): Promise<[number, number] | undefined> => {
        const pixel = await page.evaluate((coordinate: [number, number]) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;
            const rawPixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            return Array.isArray(rawPixel) && rawPixel.length >= 2
                ? ([rawPixel[0], rawPixel[1]] as [number, number])
                : undefined;
        }, targetCoordinate);

        return pixel;
    };

    await expect.poll(async () => {
        const pixel = await getPixelForCoordinate();
        const box = await mapContainer.boundingBox();
        return (
            pixel !== undefined &&
            box !== null &&
            pixel[0] >= 0 &&
            pixel[1] >= 0 &&
            pixel[0] <= box.width &&
            pixel[1] <= box.height
        );
    }).toBe(true);

    const clickPixel = await getPixelForCoordinate();
    if (!clickPixel) {
        throw new Error('Could not determine a clickable map pixel for the target coordinate.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(clickPixel[0]),
            y: Math.round(clickPixel[1])
        }
    });

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText('UV-Index Station');
    await expect(uviStationSection).not.toBeEmpty();

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
    await expect(eucosStationSection).not.toBeEmpty();
});
