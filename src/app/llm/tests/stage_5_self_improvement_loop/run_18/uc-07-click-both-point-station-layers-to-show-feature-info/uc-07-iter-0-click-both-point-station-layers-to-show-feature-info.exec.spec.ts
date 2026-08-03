// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getMapCenter,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        const pressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const uviStationsCheckbox = page.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    const eucosStationsCheckbox = page.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });

    await expect(uviStationsCheckbox).toBeChecked();
    await expect(eucosStationsCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getTargetPixel = async (): Promise<[number, number] | undefined> =>
        page.evaluate(([x, y]) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            return Array.isArray(pixel) && pixel.length >= 2
                ? ([Math.round(pixel[0]), Math.round(pixel[1])] as [number, number])
                : undefined;
        }, targetCoordinate);

    await expect.poll(getTargetPixel).not.toBeUndefined();
    const targetPixel = await getTargetPixel();
    if (!targetPixel) {
        throw new Error('Could not resolve map pixel for target coordinate.');
    }

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container bounding box is unavailable.');
    }

    expect(targetPixel[0]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[1]).toBeGreaterThanOrEqual(0);
    expect(targetPixel[0]).toBeLessThanOrEqual(mapBox.width);
    expect(targetPixel[1]).toBeLessThanOrEqual(mapBox.height);

    await mapContainer.click({
        position: { x: targetPixel[0], y: targetPixel[1] }
    });

    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');
});
