// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getHighlightedCoordinate,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const uviStationsCheckbox = page.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    const eucosStationsCheckbox = page.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        const infoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (infoPanelPressed !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    await expect(uviStationsCheckbox).toBeChecked();
    await expect(eucosStationsCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(() => measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const targetZoom = 10;

    await page.evaluate(
        ({ coordinate, zoom }) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getView?: () => {
                                cancelAnimations?: () => void;
                                setCenter?: (center: [number, number]) => void;
                                setZoom?: (zoom: number) => void;
                            };
                            renderSync?: () => void;
                        };
                    };
                }
            ).__openPioneerMap;

            const view = map?.olMap?.getView?.();
            view?.cancelAnimations?.();
            view?.setCenter?.(coordinate);
            view?.setZoom?.(zoom);
            map?.olMap?.renderSync?.();
        },
        { coordinate: targetCoordinate, zoom: targetZoom }
    );

    await expect.poll(() => getMapZoomLevel(page)).toBe(targetZoom);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Could not determine the map container bounds.');
    }

    const readTargetPixel = async (): Promise<[number, number] | undefined> => {
        return await page.evaluate((coordinate) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (
                                coordinate: [number, number]
                            ) => [number, number] | number[] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;

            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            return Array.isArray(pixel) && pixel.length >= 2
                ? ([pixel[0], pixel[1]] as [number, number])
                : undefined;
        }, targetCoordinate);
    };

    await expect
        .poll(async () => {
            const pixel = await readTargetPixel();
            return (
                pixel !== undefined &&
                Number.isFinite(pixel[0]) &&
                Number.isFinite(pixel[1]) &&
                pixel[0] >= 0 &&
                pixel[0] <= mapBox.width &&
                pixel[1] >= 0 &&
                pixel[1] <= mapBox.height
            );
        })
        .toBe(true);

    const featureInfoRequests: string[] = [];
    page.on('request', (request) => {
        if (request.url().toLowerCase().includes('getfeatureinfo')) {
            featureInfoRequests.push(request.url());
        }
    });

    const featureInfoResponsePromise = page.waitForResponse(
        (response) =>
            response.url().toLowerCase().includes('getfeatureinfo') && response.ok()
    );

    const targetPixel = await readTargetPixel();
    if (!targetPixel) {
        throw new Error('Could not convert the target coordinate to a map pixel.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(targetPixel[0]),
            y: Math.round(targetPixel[1])
        }
    });

    await featureInfoResponsePromise;
    await expect.poll(() => featureInfoRequests.length).toBeGreaterThan(0);

    await expect
        .poll(async () => {
            const highlight = await getHighlightedCoordinate(page);
            return highlight
                ? Math.abs(highlight[0] - targetCoordinate[0]) < 5 &&
                      Math.abs(highlight[1] - targetCoordinate[1]) < 5
                : false;
        })
        .toBe(true);

    await expect(infoPanel).toContainText(/UV-Index Station/i, { timeout: 30000 });
    await expect(infoPanel).toContainText(/EUCOS Ground Station/i, { timeout: 30000 });
});
