// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');
    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect(mapContainer).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    if (!(await infoPanel.isVisible())) {
        await page.getByTestId('info-panel-toggle').click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await page.getByTestId('measurement-toggle').click();
    }
    await expect(measurementPanel).toBeHidden();

    const mapSize = await mapContainer.evaluate((element) => {
        return [element.clientWidth, element.clientHeight] as [number, number];
    });
    expect(mapSize[0]).toBeGreaterThan(0);
    expect(mapSize[1]).toBeGreaterThan(0);

    const getTargetPixel = async (): Promise<[number, number] | undefined> => {
        return await page.evaluate((coordinate) => {
            const map = (globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getPixelFromCoordinate?: (coord: number[]) => number[] | undefined;
                    };
                };
            }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            return Array.isArray(pixel) &&
                pixel.length >= 2 &&
                Number.isFinite(pixel[0]) &&
                Number.isFinite(pixel[1])
                ? [Math.round(pixel[0]), Math.round(pixel[1])] as [number, number]
                : undefined;
        }, targetCoordinate);
    };

    await expect.poll(async () => {
        const pixel = await getTargetPixel();
        return pixel !== undefined;
    }).toBe(true);

    let targetPixel = await getTargetPixel();
    if (
        !targetPixel ||
        targetPixel[0] < 0 ||
        targetPixel[1] < 0 ||
        targetPixel[0] > mapSize[0] ||
        targetPixel[1] > mapSize[1]
    ) {
        await page.getByTestId('initial-extent-button').click();

        await expect.poll(async () => {
            const pixel = await getTargetPixel();
            return (
                pixel !== undefined &&
                pixel[0] >= 0 &&
                pixel[1] >= 0 &&
                pixel[0] <= mapSize[0] &&
                pixel[1] <= mapSize[1]
            );
        }).toBe(true);

        targetPixel = await getTargetPixel();
    }

    if (!targetPixel) {
        throw new Error('Could not determine a clickable pixel for the target map coordinate.');
    }

    await mapContainer.click({
        position: {
            x: targetPixel[0],
            y: targetPixel[1]
        }
    });

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText(/UV-Index Station/i);
    await expect.poll(async () => ((await uviStationSection.textContent()) ?? '').trim().length).toBeGreaterThan(
        'UV-Index Station'.length
    );

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText(/EUCOS Ground Station/i);
    await expect.poll(async () => ((await eucosStationSection.textContent()) ?? '').trim().length).toBeGreaterThan(
        'EUCOS Ground Station'.length
    );
});
