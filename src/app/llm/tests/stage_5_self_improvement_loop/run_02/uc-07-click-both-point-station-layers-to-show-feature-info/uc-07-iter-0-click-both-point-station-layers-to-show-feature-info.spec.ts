// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    await expect(infoPanelToggle).toBeVisible();
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(infoPanel).toBeVisible();

    await expect(measurementToggle).toBeVisible();
    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(layerSwitcherToggle).toBeVisible();
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(layerSwitcher).toBeVisible();

    const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    const uviCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });

    await expect(eucosCheckbox).toBeVisible();
    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();

    await expect(uviCheckbox).toBeVisible();
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    let clickPosition: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            clickPosition = await page.evaluate(() => {
                const map = (globalThis as any).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([1188692.84, 6767643.28]);
                const size = map?.olMap?.getSize?.();

                if (!pixel || !size) {
                    return undefined;
                }

                const [x, y] = pixel;
                const [width, height] = size;

                if (
                    typeof x !== 'number' ||
                    typeof y !== 'number' ||
                    typeof width !== 'number' ||
                    typeof height !== 'number' ||
                    x < 0 ||
                    y < 0 ||
                    x > width ||
                    y > height
                ) {
                    return undefined;
                }

                return {
                    x: Math.min(Math.max(Math.round(x), 1), Math.round(width) - 1),
                    y: Math.min(Math.max(Math.round(y), 1), Math.round(height) - 1)
                };
            });

            return clickPosition;
        })
        .not.toBeUndefined();

    if (!clickPosition) {
        throw new Error('Could not determine a clickable map position for the target station coordinate.');
    }

    await mapContainer.click({ position: clickPosition });

    await expect
        .poll(async () => (await infoPanel.innerText()).replace(/\s+/g, ' ').trim())
        .toMatch(/UV-Index Station/);
    await expect
        .poll(async () => (await infoPanel.innerText()).replace(/\s+/g, ' ').trim())
        .toMatch(/EUCOS Ground Station/);
});
