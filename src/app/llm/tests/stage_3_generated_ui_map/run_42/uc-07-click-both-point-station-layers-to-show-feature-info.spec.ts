// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapCenter(page)).toBeDefined();

    const infoPanel = page.getByTestId('info-panel');
    if (!(await infoPanel.isVisible())) {
        const infoPanelToggle = page.getByTestId('info-panel-toggle');
        const pressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const measurementPanel = page.getByTestId('measurement-panel');
    if (await measurementPanel.isVisible()) {
        const measurementToggle = page.getByTestId('measurement-toggle');
        const pressed = await measurementToggle.getAttribute('aria-pressed');
        if (pressed === 'true') {
            await measurementToggle.click();
        }
    }
    await expect(measurementPanel).toBeHidden();

    const layerSwitcher = page.getByTestId('layer-switcher');
    if (!(await layerSwitcher.isVisible())) {
        const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
        const pressed = await layerSwitcherToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    if (!(await isLayerRendered(page, 'UV-Index Stations'))) {
        const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
            name: 'UV-Index Stations',
            exact: true
        });
        await uviStationsCheckbox.click({ force: true });
        await expect(uviStationsCheckbox).toBeChecked();
    }
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    if (!(await isLayerRendered(page, 'EUCOS Ground Stations'))) {
        const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
            name: 'EUCOS Ground Stations',
            exact: true
        });
        await eucosStationsCheckbox.click({ force: true });
        await expect(eucosStationsCheckbox).toBeChecked();
    }
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const mapContainer = page.getByTestId('map-container');

    const getClickPosition = async (): Promise<{ x: number; y: number } | undefined> => {
        return await page.evaluate((coordinate) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            if (!Array.isArray(pixel) || pixel.length < 2) {
                return undefined;
            }
            return {
                x: Math.round(pixel[0]),
                y: Math.round(pixel[1])
            };
        }, targetCoordinate);
    };

    await expect.poll(async () => {
        const position = await getClickPosition();
        return position ? `${position.x},${position.y}` : undefined;
    }).toMatch(/^-?\d+,-?\d+$/);

    const clickPosition = await getClickPosition();
    expect(clickPosition).toBeDefined();
    if (!clickPosition) {
        throw new Error('Could not determine click position for the target map coordinate.');
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

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText('UV-Index Station');

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
});
