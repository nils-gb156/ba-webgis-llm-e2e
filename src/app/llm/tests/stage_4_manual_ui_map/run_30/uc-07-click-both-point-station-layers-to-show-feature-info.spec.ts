// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const measurementPanel = page.getByTestId('measurement-panel');
    const layerSwitcher = page.getByTestId('layer-switcher');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    if (!(await infoPanel.isVisible())) {
        const infoPanelToggle = page.getByTestId('info-panel-toggle');
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        const measurementToggle = page.getByTestId('measurement-toggle');
        if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
            await measurementToggle.click();
        }
    }
    await expect(measurementPanel).toBeHidden();

    if (!(await layerSwitcher.isVisible())) {
        const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    const ensureOperationalLayerIsActive = async (layerTitle: string) => {
        if (!(await isLayerRendered(page, layerTitle))) {
            const checkbox = layerSwitcher.getByRole('checkbox', { name: layerTitle, exact: true });
            await checkbox.click({ force: true });
            await expect(checkbox).toBeChecked();
        }
        await expect.poll(() => isLayerRendered(page, layerTitle)).toBe(true);
    };

    await ensureOperationalLayerIsActive('UV-Index Stations');
    await ensureOperationalLayerIsActive('EUCOS Ground Stations');

    await page.getByTestId('initial-extent-button').click();
    await expect.poll(() => getMapCenter(page)).toBeTruthy();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getMapClickPosition = async (): Promise<{ x: number; y: number } | undefined> => {
        return await page.evaluate((coordinate) => {
            const map = (globalThis as any).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            if (!Array.isArray(pixel) || pixel.length < 2) {
                return undefined;
            }
            return { x: pixel[0], y: pixel[1] };
        }, targetCoordinate);
    };

    const getMapSize = async (): Promise<{ width: number; height: number } | undefined> => {
        return await page.evaluate(() => {
            const map = (globalThis as any).__openPioneerMap;
            const size = map?.olMap?.getSize?.();
            if (!Array.isArray(size) || size.length < 2) {
                return undefined;
            }
            return { width: size[0], height: size[1] };
        });
    };

    await expect.poll(getMapClickPosition).toBeTruthy();
    await expect.poll(getMapSize).toBeTruthy();

    const clickPosition = await getMapClickPosition();
    const mapSize = await getMapSize();

    expect(clickPosition).toBeTruthy();
    expect(mapSize).toBeTruthy();

    expect(clickPosition!.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition!.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition!.x).toBeLessThanOrEqual(mapSize!.width);
    expect(clickPosition!.y).toBeLessThanOrEqual(mapSize!.height);

    await mapContainer.click({
        position: {
            x: clickPosition!.x,
            y: clickPosition!.y
        }
    });

    const uviStationSection = page.getByTestId('uvi-station-section');
    const uviStationInfo = page.getByTestId('uvi-station-info');
    const eucosStationSection = page.getByTestId('eucos-station-section');
    const eucosStationInfo = page.getByTestId('eucos-station-info');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(uviStationInfo).toContainText(/\S/);

    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
    await expect(eucosStationInfo).toContainText(/\S/);
});
