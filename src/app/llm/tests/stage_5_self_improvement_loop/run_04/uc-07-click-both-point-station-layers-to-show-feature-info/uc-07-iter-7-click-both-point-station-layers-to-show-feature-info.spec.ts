// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page), { timeout: 30000 }).toBeGreaterThan(0);

    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(() => measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

    const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });

    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();

    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    await expect(uviStationsCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations'), { timeout: 30000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations'), { timeout: 30000 }).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const clickPosition = await expect
        .poll(
            async () =>
                await mapContainer.evaluate(
                    (element, coordinate) => {
                        const map = (globalThis as {
                            __openPioneerMap?: {
                                olMap?: {
                                    getPixelFromCoordinate?: (c: [number, number]) => number[] | undefined;
                                    getViewport?: () => HTMLElement | undefined;
                                };
                            };
                        }).__openPioneerMap;

                        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate as [number, number]);
                        const viewport = map?.olMap?.getViewport?.();

                        if (!(element instanceof HTMLElement) || !Array.isArray(pixel) || pixel.length < 2 || !viewport) {
                            return undefined;
                        }

                        const containerRect = element.getBoundingClientRect();
                        const viewportRect = viewport.getBoundingClientRect();

                        return {
                            x: pixel[0] + viewportRect.left - containerRect.left,
                            y: pixel[1] + viewportRect.top - containerRect.top,
                            width: containerRect.width,
                            height: containerRect.height
                        };
                    },
                    targetCoordinate
                ),
            { timeout: 30000 }
        )
        .not.toBeUndefined();

    const resolvedClickPosition = clickPosition as {
        x: number;
        y: number;
        width: number;
        height: number;
    };

    expect(resolvedClickPosition.x).toBeGreaterThanOrEqual(0);
    expect(resolvedClickPosition.y).toBeGreaterThanOrEqual(0);
    expect(resolvedClickPosition.x).toBeLessThan(resolvedClickPosition.width);
    expect(resolvedClickPosition.y).toBeLessThan(resolvedClickPosition.height);

    let getFeatureInfoRequestUrl: string | undefined;
    page.on('request', (request) => {
        if (/getfeatureinfo/i.test(request.url())) {
            getFeatureInfoRequestUrl = request.url();
        }
    });

    const getFeatureInfoResponsePromise = page.waitForResponse(
        (response) => /getfeatureinfo/i.test(response.url()) && response.ok()
    );

    await mapContainer.click({
        position: {
            x: resolvedClickPosition.x,
            y: resolvedClickPosition.y
        }
    });

    await getFeatureInfoResponsePromise;
    await expect.poll(() => getFeatureInfoRequestUrl, { timeout: 30000 }).toMatch(/getfeatureinfo/i);

    await expect
        .poll(
            async () => {
                const highlightedCoordinate = await getHighlightedCoordinate(page);
                if (!highlightedCoordinate) {
                    return false;
                }

                return (
                    Math.abs(highlightedCoordinate[0] - targetCoordinate[0]) < 5000 &&
                    Math.abs(highlightedCoordinate[1] - targetCoordinate[1]) < 5000
                );
            },
            { timeout: 30000 }
        )
        .toBe(true);

    const uviSection = infoPanel.getByTestId('uvi-station-section');
    const uviInfo = infoPanel.getByTestId('uvi-station-info');

    await expect(uviSection).toBeVisible({ timeout: 30000 });
    await expect(uviSection).toContainText('UV-Index Station');
    await expect(uviInfo).toBeVisible();
    await expect(uviInfo).toContainText('Identifier');
    await expect(uviInfo).toContainText('Name');

    const readInfoPanelText = async () => ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const readUviStationText = async () => ((await uviInfo.textContent()) ?? '').replace(/\s+/g, ' ').trim();

    await expect.poll(readUviStationText, { timeout: 30000 }).toMatch(/Identifier\s*\d+(?=Name|$)/);
    await expect
        .poll(readUviStationText, { timeout: 30000 })
        .toMatch(/Name\s*.+?(?=Alias|Station Height|Alpha-3 Code|Country|$)/);

    await expect
        .poll(readInfoPanelText, { timeout: 30000 })
        .toMatch(/UV-Index Station.*EUCOS Ground Station(?:s)?|EUCOS Ground Station(?:s)?.*UV-Index Station/);

    await expect.poll(readInfoPanelText, { timeout: 30000 }).toMatch(/EUCOS Ground Station(?:s)?/);
    await expect
        .poll(readInfoPanelText, { timeout: 30000 })
        .toMatch(/EUCOS Ground Station(?:s)?.*?(WMO Identifier|Identifier)/);
    await expect
        .poll(readInfoPanelText, { timeout: 30000 })
        .toMatch(/EUCOS Ground Station(?:s)?.*?(Name|Station Type|Country)/);
});
