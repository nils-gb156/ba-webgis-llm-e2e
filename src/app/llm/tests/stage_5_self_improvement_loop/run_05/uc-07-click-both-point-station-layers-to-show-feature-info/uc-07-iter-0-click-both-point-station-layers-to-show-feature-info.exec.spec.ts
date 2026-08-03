// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) ?? 'false').toBe('false');

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

    await expect(mapContainer).toBeVisible();

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        return Array.isArray(center) && center.length === 2;
    }).toBe(true);

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getTargetPixel = async (): Promise<[number, number] | undefined> => {
        return await page.evaluate(([x, y]) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;

            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            return Array.isArray(pixel) && pixel.length >= 2
                ? [Math.round(pixel[0]), Math.round(pixel[1])]
                : undefined;
        }, targetCoordinate);
    };

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await expect.poll(async () => {
        const pixel = await getTargetPixel();
        return (
            Array.isArray(pixel) &&
            pixel.length === 2 &&
            pixel[0] >= 0 &&
            pixel[1] >= 0 &&
            pixel[0] <= mapBox.width &&
            pixel[1] <= mapBox.height
        );
    }).toBe(true);

    const targetPixel = await getTargetPixel();
    if (!targetPixel) {
        throw new Error('Target map coordinate could not be converted to a screen pixel.');
    }

    await mapContainer.click({
        position: {
            x: targetPixel[0],
            y: targetPixel[1]
        }
    });

    await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
    await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
