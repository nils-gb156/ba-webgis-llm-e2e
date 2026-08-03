// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

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
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const layerSwitcherVisible = await layerSwitcher.isVisible();
    const layerSwitcherPressed = await layerSwitcherToggle.getAttribute('aria-pressed');
    if (!layerSwitcherVisible || layerSwitcherPressed !== 'true') {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

    const infoPanelVisible = await infoPanel.isVisible();
    const infoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (!infoPanelVisible || infoPanelPressed !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

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

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    let targetPixel: [number, number] | undefined;

    await expect
        .poll(async () => {
            targetPixel = await page.evaluate(([x, y]) => {
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
                    ? ([Math.round(pixel[0]), Math.round(pixel[1])] as [number, number])
                    : undefined;
            }, targetCoordinate);
            return targetPixel !== undefined;
        })
        .toBe(true);

    if (!targetPixel) {
        throw new Error('Target map pixel could not be resolved.');
    }

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container bounding box is not available.');
    }

    expect(targetPixel[0]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[1]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[0]).toBeLessThanOrEqual(mapBox.width);
    expect(targetPixel[1]).toBeLessThanOrEqual(mapBox.height);

    const featureInfoResponsePromise = page.waitForResponse(
        (response) => response.url().toLowerCase().includes('getfeatureinfo') && response.ok()
    );

    await Promise.all([
        featureInfoResponsePromise,
        mapContainer.click({
            position: { x: targetPixel[0], y: targetPixel[1] }
        })
    ]);

    await expect(infoPanel).toContainText(/UV-Index Station/i);
    await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
});
