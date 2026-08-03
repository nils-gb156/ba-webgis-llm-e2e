// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    if (!(await layerSwitcher.isVisible())) {
        const layerSwitcherPressed = await layerSwitcherToggle.getAttribute('aria-pressed');
        if (layerSwitcherPressed !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    if (!(await infoPanel.isVisible())) {
        const infoPanelPressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (infoPanelPressed !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const measurementToggle = page.getByTestId('measurement-toggle');
    await expect(measurementToggle).toBeVisible();
    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(async () => (await measurementToggle.getAttribute('aria-pressed')) ?? 'false').not.toBe('true');

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

    await expect.poll(async () => (await getMapZoomLevel(page)) ?? -1).toBeGreaterThan(0);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const clickPosition = await page.evaluate(
        ([x, y]) => {
            const map = (
                globalThis as {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (coordinate: [number, number]) => [number, number] | undefined;
                        };
                    };
                }
            ).__openPioneerMap;

            const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
            if (!Array.isArray(pixel) || pixel.length < 2) {
                return undefined;
            }

            return {
                x: Math.round(pixel[0]),
                y: Math.round(pixel[1])
            };
        },
        [1188692.84, 6767643.28] as [number, number]
    );

    if (!clickPosition) {
        throw new Error('Could not determine map pixel for target coordinate [1188692.84, 6767643.28].');
    }

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    const featureInfoResponse = page.waitForResponse(
        (response) => response.ok() && /GetFeatureInfo/i.test(response.url())
    );

    await Promise.all([
        featureInfoResponse,
        mapContainer.click({ position: clickPosition })
    ]);

    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');
});
