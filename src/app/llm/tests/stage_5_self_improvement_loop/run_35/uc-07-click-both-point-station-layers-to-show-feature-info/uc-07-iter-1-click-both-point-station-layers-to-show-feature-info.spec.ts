// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
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
    const initialExtentButton = page.getByTestId('initial-extent-button');

    const normalizeText = async (locator: typeof infoPanel): Promise<string> =>
        ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim();

    const getTargetClickPosition = async (): Promise<{ x: number; y: number } | undefined> =>
        await page.evaluate(([targetX, targetY]) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getSize?: () => [number, number] | undefined;
                            getPixelFromCoordinate?: (
                                coordinate: [number, number]
                            ) => [number, number] | undefined;
                            getView?: () => {
                                getCenter?: () => [number, number] | undefined;
                                getResolution?: () => number | undefined;
                            };
                        };
                    };
                }
            ).__openPioneerMap;

            const olMap = map?.olMap;
            const size = olMap?.getSize?.();
            const view = olMap?.getView?.();
            const center = view?.getCenter?.();
            const resolution = view?.getResolution?.();
            const container = document.querySelector('[data-testid="map-container"]');

            if (
                !(container instanceof HTMLElement) ||
                !size ||
                size.length < 2 ||
                !center ||
                center.length < 2 ||
                typeof resolution !== 'number' ||
                !Number.isFinite(resolution) ||
                resolution <= 0
            ) {
                return undefined;
            }

            const pixelFromMap = olMap?.getPixelFromCoordinate?.([targetX, targetY]);
            const pixelX =
                Array.isArray(pixelFromMap) &&
                pixelFromMap.length >= 2 &&
                Number.isFinite(pixelFromMap[0])
                    ? pixelFromMap[0]
                    : size[0] / 2 + (targetX - center[0]) / resolution;
            const pixelY =
                Array.isArray(pixelFromMap) &&
                pixelFromMap.length >= 2 &&
                Number.isFinite(pixelFromMap[1])
                    ? pixelFromMap[1]
                    : size[1] / 2 - (targetY - center[1]) / resolution;

            if (
                !Number.isFinite(pixelX) ||
                !Number.isFinite(pixelY) ||
                pixelX < 0 ||
                pixelY < 0 ||
                pixelX > size[0] ||
                pixelY > size[1]
            ) {
                return undefined;
            }

            const rect = container.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return undefined;
            }

            const scaledX = (pixelX / size[0]) * rect.width;
            const scaledY = (pixelY / size[1]) * rect.height;

            return {
                x: Math.max(1, Math.min(rect.width - 1, scaledX)),
                y: Math.max(1, Math.min(rect.height - 1, scaledY))
            };
        }, targetCoordinate);

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
    await expect.poll(async () => await measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

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
    expect(initialInfoPanelText).not.toContain('UV-Index Station');
    expect(initialInfoPanelText).not.toContain('EUCOS Ground Station');

    let clickPosition = await getTargetClickPosition();
    if (!clickPosition) {
        await expect(initialExtentButton).toBeVisible();
        await initialExtentButton.click();
    }

    await expect
        .poll(
            async () => {
                clickPosition = await getTargetClickPosition();
                return clickPosition ? 'ready' : 'not-ready';
            },
            { timeout: 15000 }
        )
        .toBe('ready');

    await mapContainer.click({ position: clickPosition! });

    await expect
        .poll(async () => await normalizeText(infoPanel), { timeout: 15000 })
        .toMatch(/UV-Index Station/);
    await expect
        .poll(async () => await normalizeText(infoPanel), { timeout: 15000 })
        .toMatch(/EUCOS Ground Station/);
    await expect
        .poll(async () => await normalizeText(infoPanel), { timeout: 15000 })
        .not.toBe(initialInfoPanelText);
});
