// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

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
    await expect(measurementPanel).toBeHidden();

    const layerSwitcher = page.getByTestId('layer-switcher');
    if (!(await layerSwitcher.isVisible())) {
        await page.getByTestId('layer-switcher-toggle').click();
    }
    await expect(layerSwitcher).toBeVisible();

    const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    if (!(await isLayerRendered(page, 'UV-Index Stations'))) {
        await uviStationsCheckbox.click({ force: true });
        await expect(uviStationsCheckbox).toBeChecked();
    }
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    if (!(await isLayerRendered(page, 'EUCOS Ground Stations'))) {
        await eucosStationsCheckbox.click({ force: true });
        await expect(eucosStationsCheckbox).toBeChecked();
    }
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const uviStationSection = page.getByTestId('uvi-station-section');
    const eucosStationSection = page.getByTestId('eucos-station-section');
    await expect(uviStationSection).toBeHidden();
    await expect(eucosStationSection).toBeHidden();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    await expect
        .poll(() =>
            page.evaluate((coordinate) => {
                const map = (globalThis as any).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
                return Array.isArray(pixel) && pixel.length >= 2
                    ? [Math.round(pixel[0]), Math.round(pixel[1])]
                    : undefined;
            }, targetCoordinate)
        )
        .not.toBeUndefined();

    const pixel = await page.evaluate((coordinate) => {
        const map = (globalThis as any).__openPioneerMap;
        const result = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return Array.isArray(result) && result.length >= 2
            ? [Math.round(result[0]), Math.round(result[1])]
            : undefined;
    }, targetCoordinate);

    if (!pixel) {
        throw new Error('Could not determine map pixel for target coordinate.');
    }

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    expect(pixel[0]).toBeGreaterThanOrEqual(0);
    expect(pixel[1]).toBeGreaterThanOrEqual(0);
    expect(pixel[0]).toBeLessThanOrEqual(Math.ceil(mapBox.width));
    expect(pixel[1]).toBeLessThanOrEqual(Math.ceil(mapBox.height));

    await mapContainer.click({
        position: {
            x: pixel[0],
            y: pixel[1]
        }
    });

    await expect(uviStationSection).toBeVisible();
    await expect(eucosStationSection).toBeVisible();

    await expect
        .poll(async () => ((await uviStationSection.textContent()) ?? '').replace(/\s+/g, ' ').trim())
        .toMatch(/^UV-Index Station\b.+/);

    await expect
        .poll(async () => ((await eucosStationSection.textContent()) ?? '').replace(/\s+/g, ' ').trim())
        .toMatch(/^EUCOS Ground Station\b.+/);
});
