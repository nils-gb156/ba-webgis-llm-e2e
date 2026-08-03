// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('UC-07 Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    const eucosCheckbox = page.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    const uviCheckbox = page.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });

    await expect.poll(() => getMapCenter(page)).toBeDefined();

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
    await expect(infoPanel.getByRole('heading', { name: 'Information', exact: true })).toBeVisible();
    await expect(infoPanel.getByText('Click on the map to load a forecast.', { exact: true })).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) === 'true').toBe(false);

    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }

    await expect(eucosCheckbox).toBeChecked();
    await expect(uviCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations'), { timeout: 15000 }).toBe(true);

    await expect(mapContainer).toBeVisible();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const readTargetPixel = async (): Promise<[number, number] | undefined> => {
        return await page.evaluate(([x, y]) => {
            const map = (globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                    };
                };
            }).__openPioneerMap;

            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            if (!Array.isArray(pixel) || pixel.length < 2) {
                return undefined;
            }

            const rounded: [number, number] = [Math.round(pixel[0]), Math.round(pixel[1])];
            return Number.isFinite(rounded[0]) && Number.isFinite(rounded[1]) ? rounded : undefined;
        }, targetCoordinate);
    };

    await expect.poll(() => readTargetPixel(), { timeout: 15000 }).toBeDefined();

    const targetPixel = await readTargetPixel();
    expect(targetPixel).toBeDefined();
    if (!targetPixel) {
        throw new Error('Could not determine a map pixel for the target coordinate.');
    }

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    expect(targetPixel[0]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[1]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[0]).toBeLessThanOrEqual(Math.ceil(mapBox.width));
    expect(targetPixel[1]).toBeLessThanOrEqual(Math.ceil(mapBox.height));

    await mapContainer.click({
        position: {
            x: targetPixel[0],
            y: targetPixel[1]
        },
        force: true
    });

    await expect(infoPanel).toContainText('UV-Index Station', { timeout: 30000 });
    await expect(infoPanel).toContainText('EUCOS Ground Station', { timeout: 30000 });

    await expect.poll(async () => (await infoPanel.textContent()) ?? '', { timeout: 30000 }).toMatch(
        /UV-Index Station[\s\S]*Identifier/
    );
    await expect.poll(async () => (await infoPanel.textContent()) ?? '', { timeout: 30000 }).toMatch(
        /EUCOS Ground Station[\s\S]*WMO Identifier/
    );
});
