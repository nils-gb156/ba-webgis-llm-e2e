// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if (await measurementPanel.isVisible()) {
        await measurementToggle.click();
    }
    await expect(measurementPanel).toBeHidden();

    if (!(await isLayerRendered(page, 'UV-Index Stations'))) {
        if (!(await layerSwitcher.isVisible())) {
            await layerSwitcherToggle.click();
        }
        await expect(layerSwitcher).toBeVisible();
        const uviCheckbox = layerSwitcher.getByRole('checkbox', {
            name: 'UV-Index Stations',
            exact: true
        });
        await uviCheckbox.click({ force: true });
        await expect(uviCheckbox).toBeChecked();
    }

    if (!(await isLayerRendered(page, 'EUCOS Ground Stations'))) {
        if (!(await layerSwitcher.isVisible())) {
            await layerSwitcherToggle.click();
        }
        await expect(layerSwitcher).toBeVisible();
        const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
            name: 'EUCOS Ground Stations',
            exact: true
        });
        await eucosCheckbox.click({ force: true });
        await expect(eucosCheckbox).toBeChecked();
    }

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const getClickPosition = async () =>
        page.evaluate((coordinate) => {
            const map = (globalThis as any).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            const size = map?.olMap?.getSize?.();

            if (!pixel || !size) {
                return undefined;
            }

            const [x, y] = pixel;
            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                return undefined;
            }

            if (x < 0 || y < 0 || x > size[0] || y > size[1]) {
                return undefined;
            }

            return {
                x: Math.round(x),
                y: Math.round(y)
            };
        }, targetCoordinate);

    await expect.poll(getClickPosition).not.toBeUndefined();
    const clickPosition = await getClickPosition();

    if (!clickPosition) {
        throw new Error('Target map coordinate is not clickable in the current viewport.');
    }

    await mapContainer.click({ position: clickPosition });

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const uviStationInfo = infoPanel.getByTestId('uvi-station-info');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');
    const eucosStationInfo = infoPanel.getByTestId('eucos-station-info');

    await expect(uviStationSection).toBeVisible();
    await expect(uviStationInfo).toBeVisible();
    await expect(eucosStationSection).toBeVisible();
    await expect(eucosStationInfo).toBeVisible();
});
