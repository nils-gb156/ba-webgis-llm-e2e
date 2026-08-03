// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    await expect(layerSwitcherToggle).toBeVisible();
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();

    await expect(infoPanelToggle).toBeVisible();
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    await expect(measurementToggle).toBeVisible();
    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

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

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const getClickPosition = async () =>
        await page.evaluate(([x, y]) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (coordinate: number[]) => number[] | null;
                        };
                    };
                }
            ).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            if (!pixel || pixel.length < 2) {
                return undefined;
            }
            return {
                x: Math.round(pixel[0]),
                y: Math.round(pixel[1])
            };
        }, targetCoordinate);

    await expect.poll(getClickPosition).not.toBeUndefined();
    const clickPosition = await getClickPosition();
    if (!clickPosition) {
        throw new Error('Could not calculate a click position for the target map coordinate.');
    }

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }
    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThan(mapBox.width);
    expect(clickPosition.y).toBeLessThan(mapBox.height);

    const featureInfoResponsePromise = page.waitForResponse((response) => {
        return response.ok() && response.url().toLowerCase().includes('getfeatureinfo');
    });

    await mapContainer.click({ position: clickPosition });
    await featureInfoResponsePromise;

    await expect(infoPanel).toBeVisible();
    await expect(infoPanel.getByText(/UV-Index Station/i)).toBeVisible();
    await expect(infoPanel.getByText(/EUCOS Ground Station/i)).toBeVisible();

    await expect
        .poll(async () => ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim())
        .toMatch(/UV-Index Station/i);
    await expect
        .poll(async () => ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim())
        .toMatch(/EUCOS Ground Station/i);
});
