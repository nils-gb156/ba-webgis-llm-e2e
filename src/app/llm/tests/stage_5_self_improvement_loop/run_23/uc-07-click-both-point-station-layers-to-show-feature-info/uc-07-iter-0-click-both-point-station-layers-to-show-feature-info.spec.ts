// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanelToggle).toBeVisible();
    await expect(measurementToggle).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const uviStationsCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
    const eucosStationsCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });

    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }

    await expect(uviStationsCheckbox).toBeChecked();
    await expect(eucosStationsCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const infoPanelTextBeforeClick = await infoPanel.innerText();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    await expect.poll(async () => {
        return await page.evaluate((coordinate) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            const size = map?.olMap?.getSize?.();
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);

            if (!Array.isArray(size) || size.length < 2 || !Array.isArray(pixel) || pixel.length < 2) {
                return false;
            }

            const [x, y] = pixel;
            return (
                typeof x === 'number' &&
                typeof y === 'number' &&
                x >= 0 &&
                y >= 0 &&
                x <= size[0] &&
                y <= size[1]
            );
        }, targetCoordinate);
    }).toBe(true);

    const targetPixel = await page.evaluate((coordinate) => {
        const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
        const size = map?.olMap?.getSize?.();
        const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);

        if (!Array.isArray(size) || size.length < 2 || !Array.isArray(pixel) || pixel.length < 2) {
            return undefined;
        }

        const [x, y] = pixel;
        if (
            typeof x !== 'number' ||
            typeof y !== 'number' ||
            x < 0 ||
            y < 0 ||
            x > size[0] ||
            y > size[1]
        ) {
            return undefined;
        }

        return { x, y };
    }, targetCoordinate);

    if (!targetPixel) {
        throw new Error('Could not resolve a clickable pixel for the target map coordinate.');
    }

    const [featureInfoResponse] = await Promise.all([
        page.waitForResponse((response) => /getfeatureinfo/i.test(response.url()) && response.ok()),
        mapContainer.click({
            position: {
                x: Math.round(targetPixel.x),
                y: Math.round(targetPixel.y)
            }
        })
    ]);

    expect(await featureInfoResponse.text()).toMatch(/\S/);

    await expect.poll(async () => await infoPanel.innerText()).not.toBe(infoPanelTextBeforeClick);
    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');

    await expect(infoPanel.getByText('UV-Index Station', { exact: true }).first()).toBeVisible();
    await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true }).first()).toBeVisible();
});
