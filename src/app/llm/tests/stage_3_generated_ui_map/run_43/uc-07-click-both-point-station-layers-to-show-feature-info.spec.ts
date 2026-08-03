// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const measurementPanel = page.getByTestId('measurement-panel');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', /^(false)?$/);
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementPanel).not.toBeVisible();

    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', /^(false)?$/);
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();

    const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });

    if (!(await isLayerRendered(page, 'UV-Index Stations'))) {
        await uviStationsCheckbox.click({ force: true });
        await expect(uviStationsCheckbox).toBeChecked();
    }
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    if (!(await isLayerRendered(page, 'EUCOS Ground Stations'))) {
        await eucosStationsCheckbox.click({ force: true });
        await expect(eucosStationsCheckbox).toBeChecked();
    }
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const getClickPixel = async (): Promise<
        { x: number; y: number; width: number; height: number } | undefined
    > =>
        await page.evaluate(([x, y]) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            const olMap = map?.olMap;
            const pixel = olMap?.getPixelFromCoordinate?.([x, y]);
            const size = olMap?.getSize?.();
            if (
                !Array.isArray(pixel) ||
                pixel.length < 2 ||
                !Array.isArray(size) ||
                size.length < 2
            ) {
                return undefined;
            }
            return { x: pixel[0], y: pixel[1], width: size[0], height: size[1] };
        }, targetCoordinate);

    await expect.poll(getClickPixel).toBeDefined();
    const clickPixel = await getClickPixel();

    expect(clickPixel).toBeDefined();
    expect(clickPixel!.x).toBeGreaterThanOrEqual(0);
    expect(clickPixel!.y).toBeGreaterThanOrEqual(0);
    expect(clickPixel!.x).toBeLessThanOrEqual(clickPixel!.width);
    expect(clickPixel!.y).toBeLessThanOrEqual(clickPixel!.height);

    const uviFeatureInfoResponse = page.waitForResponse(
        (response) => /getfeatureinfo/i.test(response.url()) && response.ok()
    );

    await mapContainer.click({
        position: {
            x: Math.round(clickPixel!.x),
            y: Math.round(clickPixel!.y)
        }
    });

    await uviFeatureInfoResponse;

    const uviStationSection = page.getByTestId('uvi-station-section');
    const eucosStationSection = page.getByTestId('eucos-station-section');

    await expect(uviStationSection).toBeVisible();
    await expect(eucosStationSection).toBeVisible();

    await expect(uviStationSection).toContainText('UV-Index Station');
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');

    await expect
        .poll(async () => {
            const text = (await uviStationSection.textContent()) ?? '';
            return text.replace(/\s+/g, ' ').trim().length;
        })
        .toBeGreaterThan('UV-Index Station'.length);

    await expect
        .poll(async () => {
            const text = (await eucosStationSection.textContent()) ?? '';
            return text.replace(/\s+/g, ' ').trim().length;
        })
        .toBeGreaterThan('EUCOS Ground Station'.length);
});
