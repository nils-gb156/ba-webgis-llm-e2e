// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });

    await expect(uviStationsCheckbox).toBeVisible();
    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    await expect(uviStationsCheckbox).toBeChecked();

    await expect(eucosStationsCheckbox).toBeVisible();
    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(async () => {
            return await page.evaluate((coordinate) => {
                const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
                return (
                    Array.isArray(pixel) &&
                    pixel.length >= 2 &&
                    Number.isFinite(pixel[0]) &&
                    Number.isFinite(pixel[1])
                );
            }, targetCoordinate);
        })
        .toBe(true);

    const clickPosition = await page.evaluate((coordinate) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        if (!Array.isArray(pixel) || pixel.length < 2) {
            return undefined;
        }

        const [x, y] = pixel;
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return undefined;
        }

        return { x: Math.round(x), y: Math.round(y) };
    }, targetCoordinate);

    if (!clickPosition) {
        throw new Error('Could not determine map click position for the target coordinate.');
    }

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThanOrEqual(Math.round(mapBox.width));
    expect(clickPosition.y).toBeLessThanOrEqual(Math.round(mapBox.height));

    await mapContainer.click({ position: clickPosition });

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationSection).toContainText('UV-Index Station');
    await expect(uviStationSection).not.toHaveText(/^\s*UV-Index Station\s*$/);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
    await expect(eucosStationSection).not.toHaveText(/^\s*EUCOS Ground Station\s*$/);
});
