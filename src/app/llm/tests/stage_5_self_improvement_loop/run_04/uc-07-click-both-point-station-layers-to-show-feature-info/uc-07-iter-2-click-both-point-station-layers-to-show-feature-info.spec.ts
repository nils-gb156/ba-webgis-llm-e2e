// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');

    const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });

    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    await expect(uviStationsCheckbox).toBeChecked();

    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate = { x: 1188692.84, y: 6767643.28 };

    const targetPixel = await page.evaluate(({ x, y }) => {
        const map = (globalThis as {
            __openPioneerMap?: {
                olMap?: {
                    getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                };
            };
        }).__openPioneerMap;

        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
        return Array.isArray(pixel) && pixel.length >= 2 ? { x: pixel[0], y: pixel[1] } : undefined;
    }, targetCoordinate);

    expect(targetPixel).toBeDefined();
    if (!targetPixel) {
        throw new Error('Could not convert target map coordinate to a click position.');
    }

    const clickPosition = {
        x: Math.round(targetPixel.x),
        y: Math.round(targetPixel.y)
    };

    const mapContainerSize = await mapContainer.evaluate((element) => ({
        width: element.clientWidth,
        height: element.clientHeight
    }));

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThan(mapContainerSize.width);
    expect(clickPosition.y).toBeLessThan(mapContainerSize.height);

    await mapContainer.click({ position: clickPosition });

    await expect(infoPanel).toContainText('UV-Index Station', { timeout: 20000 });
    await expect(page.getByTestId('uvi-station-info')).toBeVisible({ timeout: 20000 });

    await infoPanel.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });

    await expect(infoPanel).toContainText('EUCOS Ground Station', { timeout: 20000 });
});
