// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getMapCenter,
    getMapZoomLevel,
    getHighlightedCoordinate,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
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
    await expect(infoPanel).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    await expect(uviStationsCheckbox).toBeChecked();
    await expect(eucosStationsCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(() => measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const targetCoordinateRounded = [1188693, 6767643];

    await page.evaluate(({ coordinate, zoom }) => {
        const map = (
            globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getView?: () => {
                            cancelAnimations?: () => void;
                            setCenter: (center: [number, number]) => void;
                            setZoom: (zoom: number) => void;
                        };
                        renderSync?: () => void;
                    };
                };
            }
        ).__openPioneerMap;

        const view = map?.olMap?.getView?.();
        view?.cancelAnimations?.();
        view?.setCenter(coordinate);
        view?.setZoom(9);
        map?.olMap?.renderSync?.();
    }, { coordinate: targetCoordinate, zoom: 9 });

    await expect.poll(() => getMapZoomLevel(page)).toBe(9);
    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            return center ? center.map((value) => Math.round(value)) : undefined;
        })
        .toEqual(targetCoordinateRounded);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Could not determine the map container bounds.');
    }

    await mapContainer.click({
        position: {
            x: mapBox.width / 2,
            y: mapBox.height / 2
        }
    });

    await expect
        .poll(async () => {
            const highlight = await getHighlightedCoordinate(page);
            return highlight ? highlight.map((value) => Math.round(value)) : undefined;
        })
        .toEqual(targetCoordinateRounded);

    await expect(infoPanel).toContainText('UV-Index Station', { timeout: 15000 });
    await expect(infoPanel).toContainText('EUCOS Ground Station', { timeout: 15000 });
});
