// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const infoPanel = page.getByTestId('info-panel');
    if (!(await infoPanel.isVisible())) {
        await page.getByTestId('info-panel-toggle').click();
    }
    await expect(infoPanel).toBeVisible();

    const measurementPanel = page.getByTestId('measurement-panel');
    if (await measurementPanel.isVisible()) {
        await page.getByTestId('measurement-toggle').click();
    }
    await expect(measurementPanel).not.toBeVisible();

    const layerSwitcher = page.getByTestId('layer-switcher');
    if (!(await layerSwitcher.isVisible())) {
        await page.getByTestId('layer-switcher-toggle').click();
    }
    await expect(layerSwitcher).toBeVisible();

    const uvIndexStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    if (!(await uvIndexStationsCheckbox.isChecked())) {
        await uvIndexStationsCheckbox.click({ force: true });
    }
    await expect(uvIndexStationsCheckbox).toBeChecked();

    const eucosGroundStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    if (!(await eucosGroundStationsCheckbox.isChecked())) {
        await eucosGroundStationsCheckbox.click({ force: true });
    }
    await expect(eucosGroundStationsCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect.poll(async () => {
        return await page.evaluate(([x, y]) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            return (
                Array.isArray(pixel) &&
                pixel.length >= 2 &&
                Number.isFinite(pixel[0]) &&
                Number.isFinite(pixel[1])
            );
        }, targetCoordinate);
    }).toBe(true);

    const targetPixel = await page.evaluate(([x, y]) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        return Array.isArray(pixel) && pixel.length >= 2
            ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
            : undefined;
    }, targetCoordinate);

    expect(targetPixel).toBeTruthy();
    if (!targetPixel) {
        throw new Error('Could not convert the target map coordinate to a click position.');
    }

    await mapContainer.click({ position: targetPixel });

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const uviStationInfo = infoPanel.getByTestId('uvi-station-info');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');
    const eucosStationInfo = infoPanel.getByTestId('eucos-station-info');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(uviStationInfo).toHaveText(/\S+/);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
    await expect(eucosStationInfo).toHaveText(/\S+/);
});
