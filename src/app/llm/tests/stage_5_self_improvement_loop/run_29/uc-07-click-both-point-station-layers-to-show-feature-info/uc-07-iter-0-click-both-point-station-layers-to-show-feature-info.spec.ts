// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    const infoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
    if (infoPanelPressed !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const eucosCheckbox = page.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    const uviCheckbox = page.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });

    await expect(eucosCheckbox).toBeChecked();
    await expect(uviCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    let targetPixel: [number, number] | undefined;

    await expect
        .poll(async () => {
            targetPixel = await page.evaluate(([x, y]) => {
                const map = (
                    globalThis as {
                        __openPioneerMap?: {
                            olMap?: {
                                getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                            };
                        };
                    }
                ).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                return Array.isArray(pixel) && pixel.length >= 2
                    ? ([pixel[0], pixel[1]] as [number, number])
                    : undefined;
            }, targetCoordinate);

            return targetPixel;
        })
        .toBeTruthy();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    expect(targetPixel).toBeDefined();

    const clickPosition = {
        x: Math.round(targetPixel![0]),
        y: Math.round(targetPixel![1])
    };

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThanOrEqual(Math.round(mapBox!.width));
    expect(clickPosition.y).toBeLessThanOrEqual(Math.round(mapBox!.height));

    const getFeatureInfoResponse = page.waitForResponse((response) => {
        return /getfeatureinfo/i.test(response.url()) && response.ok();
    });

    await mapContainer.click({ position: clickPosition });
    await getFeatureInfoResponse;

    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');
});
