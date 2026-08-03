// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
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

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    let clickPosition: { x: number; y: number } | undefined;
    await expect
        .poll(
            async () => {
                clickPosition = await page.evaluate((coordinate) => {
                    const map = (
                        globalThis as {
                            __openPioneerMap?: {
                                olMap?: {
                                    getPixelFromCoordinate?: (
                                        coordinate: [number, number]
                                    ) => number[] | undefined;
                                    getViewport?: () => HTMLElement | undefined;
                                };
                            };
                        }
                    ).__openPioneerMap;

                    const container = document.querySelector('[data-testid="map-container"]');
                    const viewport = map?.olMap?.getViewport?.();
                    const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);

                    if (!(container instanceof HTMLElement) || !(viewport instanceof HTMLElement)) {
                        return undefined;
                    }
                    if (!Array.isArray(pixel) || pixel.length < 2) {
                        return undefined;
                    }

                    const containerRect = container.getBoundingClientRect();
                    const viewportRect = viewport.getBoundingClientRect();

                    const x = Math.round(pixel[0] + viewportRect.left - containerRect.left);
                    const y = Math.round(pixel[1] + viewportRect.top - containerRect.top);

                    if (
                        !Number.isFinite(x) ||
                        !Number.isFinite(y) ||
                        x < 0 ||
                        y < 0 ||
                        x > container.clientWidth ||
                        y > container.clientHeight
                    ) {
                        return undefined;
                    }

                    return { x, y };
                }, coordinate);
                return clickPosition;
            },
            { timeout: 15000 }
        )
        .not.toBeUndefined();

    if (!clickPosition) {
        throw new Error('Could not resolve a clickable map position for the target coordinate.');
    }

    await mapContainer.click({ position: clickPosition });

    await expect(infoPanel.getByTestId('uvi-station-section')).toBeVisible({ timeout: 15000 });
    await expect(infoPanel.getByTestId('uvi-station-info')).toContainText('Identifier', {
        timeout: 15000
    });

    await expect
        .poll(async () => (await infoPanel.textContent()) ?? '', { timeout: 15000 })
        .toMatch(/UV-Index Station[\s\S]*Identifier/i);

    await expect
        .poll(async () => (await infoPanel.textContent()) ?? '', { timeout: 15000 })
        .toMatch(/EUCOS Ground Station[\s\S]*\S+/i);
});
