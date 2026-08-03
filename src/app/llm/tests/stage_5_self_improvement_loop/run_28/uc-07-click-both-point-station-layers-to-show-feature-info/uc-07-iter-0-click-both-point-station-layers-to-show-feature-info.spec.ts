// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('load');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();

    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(async () => await measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getClickPosition = async (): Promise<{ x: number; y: number } | null> =>
        page.evaluate(([x, y]) => {
            const map = (globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                        getSize?: () => number[] | undefined;
                    };
                };
            }).__openPioneerMap;

            const olMap = map?.olMap;
            const pixel = olMap?.getPixelFromCoordinate?.([x, y]);
            const size = olMap?.getSize?.();

            if (!Array.isArray(pixel) || pixel.length < 2 || !Array.isArray(size) || size.length < 2) {
                return null;
            }

            const [pixelX, pixelY] = pixel;
            const [width, height] = size;

            if (
                !Number.isFinite(pixelX) ||
                !Number.isFinite(pixelY) ||
                pixelX < 0 ||
                pixelY < 0 ||
                pixelX > width ||
                pixelY > height
            ) {
                return null;
            }

            return {
                x: Math.round(pixelX),
                y: Math.round(pixelY)
            };
        }, targetCoordinate);

    await expect.poll(getClickPosition).not.toBeNull();
    const clickPosition = await getClickPosition();

    if (!clickPosition) {
        throw new Error('Could not determine a clickable pixel position for the target map coordinate.');
    }

    await mapContainer.click({ position: clickPosition });

    await expect(infoPanel).toContainText(/UV-Index Station/);
    await expect(infoPanel).toContainText(/EUCOS Ground Station/);
});
