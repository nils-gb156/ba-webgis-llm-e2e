// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const initialExtentButton = page.getByTestId('initial-extent-button');
    const mapContainer = page.getByTestId('map-container');
    const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed === 'true') {
        await measurementToggle.click();
    }
    if (measurementPressed !== null) {
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
    }

    await expect(eucosCheckbox).toBeChecked();
    await expect(uviCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    await initialExtentButton.click();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect.poll(() =>
        page.evaluate((coordinate) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap: {
                            getPixelFromCoordinate: (coord: number[]) => number[] | undefined;
                            getSize: () => number[] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;
            const pixel = map?.olMap.getPixelFromCoordinate(coordinate);
            const size = map?.olMap.getSize();
            return (
                Array.isArray(pixel) &&
                pixel.length >= 2 &&
                Array.isArray(size) &&
                size.length >= 2 &&
                pixel[0] >= 0 &&
                pixel[1] >= 0 &&
                pixel[0] <= size[0] &&
                pixel[1] <= size[1]
            );
        }, targetCoordinate)
    ).toBe(true);

    const clickPosition = await page.evaluate((coordinate) => {
        const map = (
            globalThis as {
                __openPioneerMap?: {
                    olMap: {
                        getPixelFromCoordinate: (coord: number[]) => number[] | undefined;
                    };
                };
            }
        ).__openPioneerMap;
        const pixel = map?.olMap.getPixelFromCoordinate(coordinate);
        if (!Array.isArray(pixel) || pixel.length < 2) {
            return undefined;
        }
        return { x: pixel[0], y: pixel[1] };
    }, targetCoordinate);

    if (!clickPosition) {
        throw new Error('Failed to convert the target map coordinate to a click position.');
    }

    await mapContainer.click({ position: clickPosition });

    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');
});
