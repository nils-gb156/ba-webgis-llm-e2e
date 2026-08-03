// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    const uviCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });

    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();

    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getMapClickPosition = async () =>
        page.evaluate(([x, y]) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate: (coordinate: [number, number]) => number[] | undefined;
                            getTargetElement?: () => Element | null;
                        };
                    };
                }
            ).__openPioneerMap;

            const pixel = map?.olMap?.getPixelFromCoordinate([x, y]);
            const rect = map?.olMap?.getTargetElement?.()?.getBoundingClientRect();

            if (!pixel || !rect) {
                return undefined;
            }

            return {
                x: pixel[0],
                y: pixel[1],
                withinBounds:
                    pixel[0] >= 0 &&
                    pixel[1] >= 0 &&
                    pixel[0] <= rect.width &&
                    pixel[1] <= rect.height
            };
        }, targetCoordinate);

    await expect
        .poll(async () => {
            const clickPosition = await getMapClickPosition();
            return clickPosition?.withinBounds ?? false;
        })
        .toBe(true);

    const clickPosition = await getMapClickPosition();
    expect(clickPosition).toBeDefined();

    await mapContainer.click({
        position: {
            x: Math.round(clickPosition!.x),
            y: Math.round(clickPosition!.y)
        }
    });

    await expect(infoPanel).toContainText(/UV-Index Station/i);
    await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
});
