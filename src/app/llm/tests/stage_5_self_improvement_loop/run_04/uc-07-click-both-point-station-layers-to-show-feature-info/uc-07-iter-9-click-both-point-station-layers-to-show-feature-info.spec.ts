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

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

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

    await expect
        .poll(
            () =>
                page.evaluate((coordinate) => {
                    const map = (globalThis as {
                        __openPioneerMap?: {
                            layers?: {
                                getOperationalLayers?: () => unknown[];
                            };
                            olMap?: {
                                getLayers?: () => {
                                    getArray?: () => unknown[];
                                };
                            };
                        };
                    }).__openPioneerMap;

                    if (!map) {
                        return false;
                    }

                    const target = coordinate as [number, number];
                    const layers: unknown[] = [];

                    const addLayer = (value: unknown) => {
                        if (!value) {
                            return;
                        }
                        if (Array.isArray(value)) {
                            for (const entry of value) {
                                addLayer(entry);
                            }
                            return;
                        }
                        if (!layers.includes(value)) {
                            layers.push(value);
                        }
                    };

                    const operationalLayers = map.layers?.getOperationalLayers?.() ?? [];
                    const eucosEntry = operationalLayers.find(
                        (entry) => (entry as { title?: string }).title === 'EUCOS Ground Stations'
                    ) as
                        | {
                              olLayer?: unknown;
                              layer?: unknown;
                              olLayers?: unknown;
                          }
                        | undefined;

                    addLayer(eucosEntry?.olLayer);
                    addLayer(eucosEntry?.layer);
                    addLayer(eucosEntry?.olLayers);

                    for (const layer of map.olMap?.getLayers?.().getArray?.() ?? []) {
                        const titledLayer = layer as {
                            get?: (name: string) => unknown;
                            getProperties?: () => Record<string, unknown>;
                            values_?: Record<string, unknown>;
                        };
                        const title =
                            titledLayer.get?.('title') ??
                            titledLayer.getProperties?.().title ??
                            titledLayer.values_?.title;
                        if (title === 'EUCOS Ground Stations') {
                            addLayer(layer);
                        }
                    }

                    return layers.some((layer) => {
                        const source = (layer as { getSource?: () => unknown; source?: unknown }).getSource?.() ??
                            (layer as { source?: unknown }).source;
                        const features =
                            (source as {
                                getFeatures?: () => unknown[];
                            })?.getFeatures?.() ?? [];

                        return features.some((feature) => {
                            const coords = (
                                feature as {
                                    getGeometry?: () => {
                                        getCoordinates?: () => number[];
                                    };
                                }
                            )
                                .getGeometry?.()
                                ?.getCoordinates?.();

                            return (
                                Array.isArray(coords) &&
                                coords.length >= 2 &&
                                Math.hypot(coords[0] - target[0], coords[1] - target[1]) < 500
                            );
                        });
                    });
                }, targetCoordinate),
            { timeout: 30000 }
        )
        .toBe(true);

    let clickPosition:
        | {
              x: number;
              y: number;
              width: number;
              height: number;
          }
        | undefined;

    await expect
        .poll(
            async () => {
                clickPosition = await mapContainer.evaluate((element, coordinate) => {
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

                    const x = pixel[0] + viewportRect.left - containerRect.left;
                    const y = pixel[1] + viewportRect.top - containerRect.top;

                    if (
                        !Number.isFinite(x) ||
                        !Number.isFinite(y) ||
                        x < 0 ||
                        y < 0 ||
                        x >= containerRect.width ||
                        y >= containerRect.height
                    ) {
                        return undefined;
                    }

                    return {
                        x,
                        y,
                        width: containerRect.width,
                        height: containerRect.height
                    };
                }, targetCoordinate);

                return clickPosition ? 'ready' : undefined;
            },
            { timeout: 30000 }
        )
        .toBe('ready');

    expect(clickPosition).toBeDefined();
    expect(clickPosition!.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition!.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition!.x).toBeLessThan(clickPosition!.width);
    expect(clickPosition!.y).toBeLessThan(clickPosition!.height);

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
            x: clickPosition!.x,
            y: clickPosition!.y
        },
        force: true
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

    const readInfoPanelText = async () => ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim();

    const uviSection = infoPanel.getByTestId('uvi-station-section');
    const uviInfo = infoPanel.getByTestId('uvi-station-info');

    await expect(uviSection).toBeVisible();
    await expect(uviInfo).toBeVisible();

    await expect
        .poll(readInfoPanelText, { timeout: 30000 })
        .toMatch(/UV-Index Station[\s\S]*?(Identifier|Name|Alias|Station Height|Alpha-3 Code|Country)/);

    await expect
        .poll(readInfoPanelText, { timeout: 30000 })
        .toMatch(/EUCOS Ground Station[\s\S]*?(WMO Identifier|Identifier|Name|Station Type|Country)/);
});
