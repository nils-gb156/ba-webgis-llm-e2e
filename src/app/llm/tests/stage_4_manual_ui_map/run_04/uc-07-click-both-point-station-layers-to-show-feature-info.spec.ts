// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    if (await measurementPanel.isVisible()) {
        if ((await measurementToggle.getAttribute('aria-pressed')) !== 'false') {
            await measurementToggle.click();
        }
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

    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    await expect(uviStationsCheckbox).toBeChecked();

    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const uviSection = infoPanel.getByTestId('uvi-station-section');
    const uviInfo = infoPanel.getByTestId('uvi-station-info');
    const eucosSection = infoPanel.getByTestId('eucos-station-section');
    const eucosInfo = infoPanel.getByTestId('eucos-station-info');

    await expect(uviSection).toBeHidden();
    await expect(eucosSection).toBeHidden();

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
            }, coordinateToArray(targetCoordinate));
        })
        .toBe(true);

    const clickPixel = await page.evaluate((coordinate) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return Array.isArray(pixel) && pixel.length >= 2
            ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
            : undefined;
    }, coordinateToArray(targetCoordinate));

    if (!clickPixel) {
        throw new Error('Could not determine a screen pixel for the target map coordinate.');
    }

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Could not determine the map container bounding box.');
    }

    expect(clickPixel.x).toBeGreaterThan(0);
    expect(clickPixel.y).toBeGreaterThan(0);
    expect(clickPixel.x).toBeLessThan(mapBox.width);
    expect(clickPixel.y).toBeLessThan(mapBox.height);

    await mapContainer.click({ position: clickPixel });

    await expect(uviSection).toBeVisible();
    await expect(uviInfo).toBeVisible();
    await expect(uviInfo).toContainText(/\S/);

    await expect(eucosSection).toBeVisible();
    await expect(eucosInfo).toBeVisible();
    await expect(eucosInfo).toContainText(/\S/);
});

function coordinateToArray(coordinate: readonly [number, number]): [number, number] {
    return [coordinate[0], coordinate[1]];
}
