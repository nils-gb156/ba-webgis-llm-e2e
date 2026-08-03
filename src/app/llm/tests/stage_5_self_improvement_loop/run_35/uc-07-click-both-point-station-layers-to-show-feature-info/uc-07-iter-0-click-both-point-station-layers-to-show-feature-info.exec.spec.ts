// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const normalizeText = async (locator: typeof infoPanel) =>
        ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();

    await expect(mapContainer).toBeVisible();

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
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');

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

    await expect.poll(() => getMapCenter(page)).toBeTruthy();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const initialInfoPanelText = await normalizeText(infoPanel);

    let clickPosition: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            clickPosition = await page.evaluate(([x, y]) => {
                const map = (
                    globalThis as {
                        __openPioneerMap?: {
                            olMap?: {
                                getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                                getViewport?: () => Element | null;
                            };
                        };
                    }
                ).__openPioneerMap;

                const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                const viewport = map?.olMap?.getViewport?.();
                const container = document.querySelector('[data-testid="map-container"]');

                if (
                    !pixel ||
                    pixel.length < 2 ||
                    !(viewport instanceof HTMLElement) ||
                    !(container instanceof HTMLElement)
                ) {
                    return undefined;
                }

                const viewportRect = viewport.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                const relativeX = pixel[0] + viewportRect.left - containerRect.left;
                const relativeY = pixel[1] + viewportRect.top - containerRect.top;

                if (
                    relativeX < 0 ||
                    relativeY < 0 ||
                    relativeX > containerRect.width ||
                    relativeY > containerRect.height
                ) {
                    return undefined;
                }

                return { x: relativeX, y: relativeY };
            }, targetCoordinate);

            return clickPosition ? 'ready' : 'not-ready';
        })
        .toBe('ready');

    await mapContainer.click({ position: clickPosition! });

    await expect
        .poll(async () => normalizeText(infoPanel))
        .toContain('UV-Index Station');
    await expect
        .poll(async () => normalizeText(infoPanel))
        .toContain('EUCOS Ground Station');
    await expect
        .poll(async () => normalizeText(infoPanel))
        .not.toBe(initialInfoPanelText);
});
