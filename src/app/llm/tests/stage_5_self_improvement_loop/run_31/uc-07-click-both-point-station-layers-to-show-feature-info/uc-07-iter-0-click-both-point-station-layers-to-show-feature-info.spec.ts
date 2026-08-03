// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    await expect(mapContainer).toBeVisible();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(async () => {
            return await page.evaluate((coordinate) => {
                const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
                const pixel = map?.olMap.getPixelFromCoordinate(coordinate);
                const size = map?.olMap.getSize?.();
                if (!pixel || !size) {
                    return undefined;
                }

                const [x, y] = pixel;
                if (x < 0 || y < 0 || x > size[0] || y > size[1]) {
                    return undefined;
                }

                return [Math.round(x), Math.round(y)];
            }, targetCoordinate);
        })
        .not.toBeUndefined();

    const clickPixel = await page.evaluate((coordinate) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const pixel = map?.olMap.getPixelFromCoordinate(coordinate);
        if (!pixel) {
            return undefined;
        }
        return [Math.round(pixel[0]), Math.round(pixel[1])];
    }, targetCoordinate);

    if (!clickPixel) {
        throw new Error('Could not determine map pixel for the target coordinate.');
    }

    await mapContainer.click({
        position: {
            x: clickPixel[0],
            y: clickPixel[1]
        }
    });

    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');
});
