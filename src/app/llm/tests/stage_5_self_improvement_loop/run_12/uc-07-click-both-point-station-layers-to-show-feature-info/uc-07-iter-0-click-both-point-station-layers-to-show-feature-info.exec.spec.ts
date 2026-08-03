// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getActiveBaseLayerTitle,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(async () => await measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

    const uviStationsCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    await expect(uviStationsCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const eucosStationsCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(async () => {
            return await page.evaluate(([x, y]) => {
                const map = (globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                        };
                    };
                }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                return Array.isArray(pixel) &&
                    pixel.length >= 2 &&
                    Number.isFinite(pixel[0]) &&
                    Number.isFinite(pixel[1])
                    ? [pixel[0], pixel[1]]
                    : undefined;
            }, targetCoordinate);
        })
        .not.toBeUndefined();

    const targetPixel = await page.evaluate(([x, y]) => {
        const map = (globalThis as {
            __openPioneerMap?: {
                olMap?: {
                    getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                };
            };
        }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        return Array.isArray(pixel) && pixel.length >= 2 ? [pixel[0], pixel[1]] : undefined;
    }, targetCoordinate);

    expect(targetPixel).toBeDefined();

    const featureInfoResponsePromise = page.waitForResponse((response) =>
        response.url().toLowerCase().includes('getfeatureinfo')
    );

    await mapContainer.click({
        position: {
            x: Math.round(targetPixel![0]),
            y: Math.round(targetPixel![1])
        }
    });

    const featureInfoResponse = await featureInfoResponsePromise;
    expect(featureInfoResponse.ok()).toBeTruthy();

    await expect(infoPanel).toBeVisible();
    await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible();
    await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
