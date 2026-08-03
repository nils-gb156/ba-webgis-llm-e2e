// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    const uviCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });

    await expect(eucosCheckbox).toBeChecked();
    await expect(uviCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const initialInfoText = (await infoPanel.textContent()) ?? '';
    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(async () => {
            return await page.evaluate(([x, y]) => {
                const map = (globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (
                                coordinate: [number, number]
                            ) => [number, number] | undefined;
                        };
                    };
                }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                return Array.isArray(pixel) && pixel.length >= 2
                    ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
                    : undefined;
            }, targetCoordinate);
        })
        .not.toBeUndefined();

    const clickPosition = await page.evaluate(([x, y]) => {
        const map = (globalThis as {
            __openPioneerMap?: {
                olMap?: {
                    getPixelFromCoordinate?: (
                        coordinate: [number, number]
                    ) => [number, number] | undefined;
                };
            };
        }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        return Array.isArray(pixel) && pixel.length >= 2
            ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
            : undefined;
    }, targetCoordinate);

    expect(clickPosition).toBeDefined();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    if (!clickPosition || !mapBox) {
        throw new Error('Failed to resolve a clickable map position for the target coordinate.');
    }

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThan(mapBox.width);
    expect(clickPosition.y).toBeLessThan(mapBox.height);

    const safeClickPosition = {
        x: Math.min(Math.max(clickPosition.x, 1), Math.max(1, Math.floor(mapBox.width) - 1)),
        y: Math.min(Math.max(clickPosition.y, 1), Math.max(1, Math.floor(mapBox.height) - 1))
    };

    await mapContainer.click({ position: safeClickPosition });

    await expect(infoPanel).toContainText(/UV-Index Station/i);
    await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
    await expect
        .poll(async () => ((await infoPanel.textContent()) ?? '').length)
        .toBeGreaterThan(initialInfoText.length);
});
