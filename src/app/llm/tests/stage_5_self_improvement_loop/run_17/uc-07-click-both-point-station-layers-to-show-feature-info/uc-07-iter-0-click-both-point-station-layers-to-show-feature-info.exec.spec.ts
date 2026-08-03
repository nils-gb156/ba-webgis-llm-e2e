// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const measurementToggle = page.getByTestId('measurement-toggle');
    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const uviCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    const getPixelForCoordinate = async () => {
        return await page.evaluate(() => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;

            const pixel = map?.olMap?.getPixelFromCoordinate?.([1188692.84, 6767643.28]);
            return Array.isArray(pixel) && pixel.length >= 2
                ? [Math.round(pixel[0]), Math.round(pixel[1])]
                : undefined;
        });
    };

    await expect.poll(getPixelForCoordinate).not.toBeUndefined();
    const mapPixel = await getPixelForCoordinate();
    if (!mapPixel) {
        throw new Error('Could not resolve map pixel for target coordinate.');
    }

    await mapContainer.click({
        position: {
            x: mapPixel[0],
            y: mapPixel[1]
        }
    });

    await expect(infoPanel).toContainText(/UV-Index Station/i);
    await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
});
