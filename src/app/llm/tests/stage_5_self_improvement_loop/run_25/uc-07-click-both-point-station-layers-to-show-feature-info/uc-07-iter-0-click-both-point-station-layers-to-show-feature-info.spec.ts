// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) === 'true').toBe(false);

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

    const initialInfoPanelText = ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect
        .poll(async () => {
            return await page.evaluate((coordinate) => {
                const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined } } }).__openPioneerMap;
                const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
                return Array.isArray(pixel) && pixel.length >= 2
                    ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
                    : undefined;
            }, targetCoordinate);
        })
        .toBeTruthy();

    const clickPosition = await page.evaluate((coordinate) => {
        const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined } } }).__openPioneerMap;
        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
        return Array.isArray(pixel) && pixel.length >= 2
            ? { x: Math.round(pixel[0]), y: Math.round(pixel[1]) }
            : undefined;
    }, targetCoordinate);

    if (!clickPosition) {
        throw new Error('Could not convert target map coordinate to a clickable pixel position.');
    }

    const getFeatureInfoResponsePromise = page.waitForResponse((response) => {
        return response.ok() && response.url().toLowerCase().includes('getfeatureinfo');
    });

    await mapContainer.click({ position: clickPosition });
    await getFeatureInfoResponsePromise;

    await expect(infoPanel.getByText(/\bUV-Index Station\b/)).toBeVisible();
    await expect(infoPanel.getByText(/\bEUCOS Ground Station\b/)).toBeVisible();

    await expect
        .poll(async () => ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim().length)
        .toBeGreaterThan(initialInfoPanelText.length);
});
