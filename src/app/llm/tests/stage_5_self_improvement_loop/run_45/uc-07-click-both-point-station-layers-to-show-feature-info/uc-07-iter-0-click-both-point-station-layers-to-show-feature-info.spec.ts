// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'Information', exact: true })).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) === 'true').toBe(false);

    const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }

    await expect(eucosCheckbox).toBeChecked();
    await expect(uviCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    await expect(mapContainer).toBeVisible();
    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const targetPixel = await page.evaluate(([x, y]) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate([x, y]);
        return Array.isArray(pixel) && pixel.length >= 2 ? [pixel[0], pixel[1]] : undefined;
    }, targetCoordinate);

    expect(targetPixel).toBeDefined();
    expect(targetPixel![0]).toBeGreaterThanOrEqual(0);
    expect(targetPixel![1]).toBeGreaterThanOrEqual(0);
    expect(targetPixel![0]).toBeLessThanOrEqual(mapBox!.width);
    expect(targetPixel![1]).toBeLessThanOrEqual(mapBox!.height);

    await mapContainer.click({
        position: {
            x: Math.round(targetPixel![0]),
            y: Math.round(targetPixel![1])
        }
    });

    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');
});
