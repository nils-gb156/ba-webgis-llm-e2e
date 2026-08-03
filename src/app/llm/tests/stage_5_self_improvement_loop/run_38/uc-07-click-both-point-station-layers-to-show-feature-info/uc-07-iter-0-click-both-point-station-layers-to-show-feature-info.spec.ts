// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(infoPanel).toBeVisible();

    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(layerSwitcher).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(async () => await measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

    const eucosStationsCheckbox = page.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    const uviStationsCheckbox = page.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });

    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }

    await expect(eucosStationsCheckbox).toBeChecked();
    await expect(uviStationsCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const getPixelForCoordinate = async (): Promise<[number, number] | undefined> => {
        return await page.evaluate((coordinate: [number, number]) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap: {
                            getPixelFromCoordinate: (coord: [number, number]) => number[] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;
            const pixel = map?.olMap.getPixelFromCoordinate(coordinate);
            return Array.isArray(pixel) && pixel.length >= 2
                ? ([pixel[0], pixel[1]] as [number, number])
                : undefined;
        }, [1188692.84, 6767643.28]);
    };

    await expect.poll(getPixelForCoordinate).not.toBeUndefined();

    const targetPixel = await getPixelForCoordinate();
    if (!targetPixel) {
        throw new Error('Target map coordinate could not be converted to a pixel position.');
    }

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container bounding box is unavailable.');
    }

    expect(targetPixel[0]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[0]).toBeLessThanOrEqual(mapBox.width);
    expect(targetPixel[1]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[1]).toBeLessThanOrEqual(mapBox.height);

    await mapContainer.click({
        position: {
            x: Math.round(targetPixel[0]),
            y: Math.round(targetPixel[1])
        }
    });

    await expect(infoPanel).toBeVisible();
    await expect.poll(async () => (await infoPanel.textContent()) ?? '').toMatch(/UV-Index Station/i);
    await expect.poll(async () => (await infoPanel.textContent()) ?? '').toMatch(/EUCOS Ground Station/i);
});
