// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
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

    const eucosStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    const uviStationsCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });

    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();

    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    await expect(uviStationsCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    let clickPosition:
        | {
              x: number;
              y: number;
              width: number;
              height: number;
          }
        | undefined;

    await expect
        .poll(
            async () => {
                clickPosition = await mapContainer.evaluate(
                    (
                        element,
                        [x, y]: [number, number]
                    ) => {
                        const map = (globalThis as {
                            __openPioneerMap?: {
                                olMap?: {
                                    getPixelFromCoordinate?: (coordinate: [number, number]) => number[] | undefined;
                                    getViewport?: () => HTMLElement | undefined;
                                };
                            };
                        }).__openPioneerMap;

                        const pixel = map?.olMap?.getPixelFromCoordinate?.([x, y]);
                        const viewport = map?.olMap?.getViewport?.();

                        if (!(element instanceof HTMLElement) || !Array.isArray(pixel) || pixel.length < 2 || !viewport) {
                            return undefined;
                        }

                        const containerRect = element.getBoundingClientRect();
                        const viewportRect = viewport.getBoundingClientRect();

                        return {
                            x: pixel[0] + viewportRect.left - containerRect.left,
                            y: pixel[1] + viewportRect.top - containerRect.top,
                            width: containerRect.width,
                            height: containerRect.height
                        };
                    },
                    targetCoordinate
                );

                return clickPosition !== undefined;
            },
            { timeout: 30000 }
        )
        .toBe(true);

    if (!clickPosition) {
        throw new Error('Could not determine the map click position for the target coordinate.');
    }

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThan(clickPosition.width);
    expect(clickPosition.y).toBeLessThan(clickPosition.height);

    let getFeatureInfoRequestUrl: string | undefined;
    page.on('request', (request) => {
        if (/getfeatureinfo/i.test(request.url())) {
            getFeatureInfoRequestUrl = request.url();
        }
    });

    const getFeatureInfoResponse = page.waitForResponse(
        (response) => /getfeatureinfo/i.test(response.url()) && response.ok()
    );

    await mapContainer.click({
        position: {
            x: clickPosition.x,
            y: clickPosition.y
        }
    });

    await getFeatureInfoResponse;
    await expect.poll(() => getFeatureInfoRequestUrl ?? '', { timeout: 30000 }).toMatch(/getfeatureinfo/i);

    const uviStationSection = infoPanel.getByTestId('uvi-station-section');
    const uviStationInfo = infoPanel.getByTestId('uvi-station-info');
    const eucosStationSection = infoPanel.getByTestId('eucos-station-section');
    const eucosStationInfo = infoPanel.getByTestId('eucos-station-info');

    await expect(uviStationSection).toBeVisible({ timeout: 30000 });
    await expect(uviStationSection).toContainText('UV-Index Station');

    await expect(eucosStationSection).toBeVisible({ timeout: 30000 });
    await expect(eucosStationSection).toContainText('EUCOS Ground Station');

    await expect(uviStationInfo).toBeVisible();
    await expect
        .poll(async () => (await uviStationInfo.textContent()) ?? '', { timeout: 30000 })
        .toMatch(/Identifier\s*\S+/);
    await expect
        .poll(async () => (await uviStationInfo.textContent()) ?? '', { timeout: 30000 })
        .toMatch(/Name\s*\S+/);

    await expect(eucosStationInfo).toBeVisible();
    await expect
        .poll(async () => (await eucosStationInfo.textContent()) ?? '', { timeout: 30000 })
        .toMatch(/WMO Identifier\s*\S+/);
    await expect
        .poll(async () => (await eucosStationInfo.textContent()) ?? '', { timeout: 30000 })
        .toMatch(/Name\s*\S+/);
});
