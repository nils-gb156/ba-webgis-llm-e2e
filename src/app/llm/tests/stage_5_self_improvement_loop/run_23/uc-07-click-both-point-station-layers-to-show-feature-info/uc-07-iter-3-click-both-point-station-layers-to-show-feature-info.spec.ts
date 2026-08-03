// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('UC-07 Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const initialExtentButton = page.getByTestId('initial-extent-button');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanelToggle).toBeVisible();
    await expect(measurementToggle).toBeVisible();
    await expect(initialExtentButton).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

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

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getTargetPixel = async (): Promise<{ x: number; y: number } | undefined> => {
        return await page.evaluate((coordinate: [number, number]) => {
            const map = (globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
                        getSize?: () => number[] | undefined;
                    };
                };
            }).__openPioneerMap;

            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            const size = map?.olMap?.getSize?.();

            if (!Array.isArray(pixel) || pixel.length < 2 || !Array.isArray(size) || size.length < 2) {
                return undefined;
            }

            const [x, y] = pixel;
            const [width, height] = size;

            if (
                typeof x !== 'number' ||
                typeof y !== 'number' ||
                typeof width !== 'number' ||
                typeof height !== 'number' ||
                Number.isNaN(x) ||
                Number.isNaN(y) ||
                Number.isNaN(width) ||
                Number.isNaN(height) ||
                x < 0 ||
                y < 0 ||
                x > width ||
                y > height
            ) {
                return undefined;
            }

            return { x, y };
        }, targetCoordinate);
    };

    if ((await getTargetPixel()) === undefined) {
        await initialExtentButton.click();
    }

    await expect.poll(async () => (await getTargetPixel()) !== undefined, { timeout: 10000 }).toBe(true);

    const targetPixel = await getTargetPixel();
    if (!targetPixel) {
        throw new Error('Could not resolve a clickable pixel for the target map coordinate.');
    }

    const infoPanelTextBeforeClick = (await infoPanel.textContent()) ?? '';

    await mapContainer.click({
        position: {
            x: Math.round(targetPixel.x),
            y: Math.round(targetPixel.y)
        }
    });

    await expect.poll(async () => (await infoPanel.textContent()) ?? '', { timeout: 20000 }).not.toBe(
        infoPanelTextBeforeClick
    );

    await expect(infoPanel.getByText('UV-Index Station', { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(infoPanel.getByText('EUCOS Ground Station', { exact: true })).toBeVisible({ timeout: 20000 });

    await expect.poll(async () => (await infoPanel.textContent()) ?? '', { timeout: 20000 }).toMatch(
        /UV-Index Station[\s\S]*EUCOS Ground Station|EUCOS Ground Station[\s\S]*UV-Index Station/u
    );
});
