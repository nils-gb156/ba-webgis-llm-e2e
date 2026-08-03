// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
    getHighlightedCoordinate,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

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

    const uviStationsCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
    const eucosStationsCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });

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

    const clickDispatched = await page.evaluate(({ x, y }) => {
        const map = (
            globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getPixelFromCoordinate: (coord: [number, number]) => [number, number];
                        dispatchEvent: (event: unknown) => void;
                    };
                };
            }
        ).__openPioneerMap?.olMap;

        if (!map) {
            return false;
        }

        const coordinate: [number, number] = [x, y];
        const pixel = map.getPixelFromCoordinate(coordinate);
        const originalEvent = new MouseEvent('click');

        map.dispatchEvent({
            type: 'click',
            coordinate,
            pixel,
            map,
            originalEvent
        });

        map.dispatchEvent({
            type: 'singleclick',
            coordinate,
            pixel,
            map,
            originalEvent
        });

        return true;
    }, targetCoordinate);

    expect(clickDispatched).toBe(true);

    await expect
        .poll(async () => {
            const highlighted = await getHighlightedCoordinate(page);
            if (!highlighted) {
                return false;
            }

            return (
                Math.abs(highlighted[0] - targetCoordinate.x) < 1 &&
                Math.abs(highlighted[1] - targetCoordinate.y) < 1
            );
        })
        .toBe(true);

    const uviSectionTitle = infoPanel.getByText('UV-Index Station', { exact: true });
    const eucosSectionTitle = infoPanel.getByText('EUCOS Ground Station', { exact: true });

    await expect(uviSectionTitle).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('uvi-station-info')).toBeVisible({ timeout: 15000 });
    await expect(eucosSectionTitle).toBeVisible({ timeout: 15000 });
});
