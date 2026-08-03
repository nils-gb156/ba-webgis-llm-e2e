// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const layerSwitcher = page.getByTestId('layer-switcher');

    await expect(mapContainer).toBeVisible();
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    if (!(await infoPanel.isVisible())) {
        await page.getByTestId('info-panel-toggle').click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await page.getByTestId('measurement-toggle').click();
    }
    await expect(measurementPanel).toBeHidden();

    if (!(await layerSwitcher.isVisible())) {
        await page.getByTestId('layer-switcher-toggle').click();
    }
    await expect(layerSwitcher).toBeVisible();

    const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });

    await expect(uviStationsCheckbox).toBeVisible();
    await expect(eucosStationsCheckbox).toBeVisible();

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

    await page.getByTestId('initial-extent-button').click();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const getTargetPixel = async (): Promise<[number, number] | undefined> => {
        const pixel = await page.evaluate((coordinate) => {
            const map = (globalThis as any).__openPioneerMap;
            const rawPixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            return Array.isArray(rawPixel) && rawPixel.length >= 2
                ? [Math.round(rawPixel[0]), Math.round(rawPixel[1])]
                : undefined;
        }, targetCoordinate);
        return Array.isArray(pixel) && pixel.length >= 2
            ? [pixel[0], pixel[1]]
            : undefined;
    };

    await expect
        .poll(async () => {
            const pixel = await getTargetPixel();
            return (
                !!pixel &&
                pixel[0] >= 0 &&
                pixel[1] >= 0 &&
                pixel[0] <= mapBox.width &&
                pixel[1] <= mapBox.height
            );
        })
        .toBe(true);

    const targetPixel = await getTargetPixel();
    if (!targetPixel) {
        throw new Error('Could not determine pixel position for target map coordinate.');
    }

    await mapContainer.click({
        position: { x: targetPixel[0], y: targetPixel[1] },
        force: true
    });

    const uviSection = infoPanel.getByTestId('uvi-station-section');
    const uviInfo = infoPanel.getByTestId('uvi-station-info');
    const eucosSection = infoPanel.getByTestId('eucos-station-section');
    const eucosInfo = infoPanel.getByTestId('eucos-station-info');

    await expect(uviSection).toBeVisible();
    await expect(uviInfo).toBeVisible();
    await expect(uviInfo).toContainText(/\S+/);

    await expect(eucosSection).toBeVisible();
    await expect(eucosInfo).toBeVisible();
    await expect(eucosInfo).toContainText(/\S+/);
});
