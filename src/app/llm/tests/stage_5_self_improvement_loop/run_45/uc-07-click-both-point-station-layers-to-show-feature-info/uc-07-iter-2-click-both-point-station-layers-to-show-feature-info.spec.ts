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

    const eucosCheckbox = page.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    const uviCheckbox = page.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const uviStationInfo = infoPanel.getByTestId('uvi-station-info');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');
    const eucosStationInfo = infoPanel.getByTestId('eucos-station-info');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => getMapCenter(page)).toBeDefined();

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

    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }

    await expect(eucosCheckbox).toBeChecked();
    await expect(uviCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations'), { timeout: 15000 }).toBe(true);

    await expect(uviStationSection).toHaveCount(0);
    await expect(eucosStationSection).toHaveCount(0);

    await expect(mapContainer).toBeVisible();

    const targetPixel = await expect
        .poll(
            async () =>
                await page.evaluate(([x, y]) => {
                    const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined } } }).__openPioneerMap;
                    const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                    return Array.isArray(pixel) && pixel.length >= 2
                        ? ([Math.round(pixel[0]), Math.round(pixel[1])] as [number, number])
                        : undefined;
                }, [1188692.84, 6767643.28] as [number, number]),
            { timeout: 15000 }
        )
        .toBeDefined();

    const clickPosition = targetPixel as [number, number];
    await mapContainer.click({
        position: {
            x: clickPosition[0],
            y: clickPosition[1]
        }
    });

    await expect(uviStationSection).toBeVisible({ timeout: 30000 });
    await expect(uviStationInfo).toBeVisible({ timeout: 30000 });
    await expect(eucosStationSection).toBeVisible({ timeout: 30000 });
    await expect(eucosStationInfo).toBeVisible({ timeout: 30000 });

    await expect(uviStationSection).toContainText('UV-Index Station');
    await expect(uviStationInfo).toContainText('Identifier');
    await expect(uviStationInfo).toContainText('Name');

    await expect(eucosStationSection).toContainText('EUCOS Ground Station');
    await expect(eucosStationInfo).toContainText('WMO Identifier');
    await expect(eucosStationInfo).toContainText('Name');
});
