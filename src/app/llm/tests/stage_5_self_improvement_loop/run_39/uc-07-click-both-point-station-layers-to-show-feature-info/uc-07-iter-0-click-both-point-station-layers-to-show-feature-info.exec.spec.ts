// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

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
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const uviStationsCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    await expect(uviStationsCheckbox).toBeChecked();

    const eucosStationsCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect.poll(async () => {
        return await page.evaluate(([x, y]) => {
            const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coordinate: number[]) => number[] | undefined } } }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            return Array.isArray(pixel) &&
                pixel.length >= 2 &&
                Number.isFinite(pixel[0]) &&
                Number.isFinite(pixel[1])
                ? [Math.round(pixel[0]), Math.round(pixel[1])]
                : undefined;
        }, targetCoordinate);
    }).toEqual(expect.any(Array));

    const targetPixel = await page.evaluate(([x, y]) => {
        const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coordinate: number[]) => number[] | undefined } } }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        return Array.isArray(pixel) &&
            pixel.length >= 2 &&
            Number.isFinite(pixel[0]) &&
            Number.isFinite(pixel[1])
            ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
            : undefined;
    }, targetCoordinate);

    expect(targetPixel).toBeDefined();

    if (!targetPixel) {
        throw new Error('Could not compute target pixel for map coordinate.');
    }

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    expect(targetPixel.x).toBeGreaterThan(0);
    expect(targetPixel.y).toBeGreaterThan(0);
    expect(targetPixel.x).toBeLessThan(mapBox.width);
    expect(targetPixel.y).toBeLessThan(mapBox.height);

    const featureInfoResponsePromise = page.waitForResponse(
        (response) =>
            response.request().method() === 'GET' &&
            /getfeatureinfo/i.test(response.url())
    );

    await mapContainer.click({
        position: {
            x: targetPixel.x,
            y: targetPixel.y
        }
    });

    const featureInfoResponse = await featureInfoResponsePromise;
    expect(featureInfoResponse.ok()).toBeTruthy();

    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');
});
