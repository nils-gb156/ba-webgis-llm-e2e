// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const layerSwitcher = page.getByTestId('layer-switcher');
    if (!(await layerSwitcher.isVisible())) {
        const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    const infoPanel = page.getByTestId('info-panel');
    if (!(await infoPanel.isVisible())) {
        const infoPanelToggle = page.getByTestId('info-panel-toggle');
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const measurementToggle = page.getByTestId('measurement-toggle');
    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const eucosCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();

    const uviCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const mapContainer = page.getByTestId('map-container');
    await expect(mapContainer).toBeVisible();

    let clickPosition: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            clickPosition = await page.evaluate(([x, y]) => {
                const map = (globalThis as {
                    __openPioneerMap?: {
                        olMap: {
                            getPixelFromCoordinate: (coordinate: [number, number]) => number[] | undefined;
                        };
                    };
                }).__openPioneerMap;

                const pixel = map?.olMap.getPixelFromCoordinate([x, y]);
                if (
                    !pixel ||
                    pixel.length < 2 ||
                    Number.isNaN(pixel[0]) ||
                    Number.isNaN(pixel[1]) ||
                    !Number.isFinite(pixel[0]) ||
                    !Number.isFinite(pixel[1])
                ) {
                    return undefined;
                }

                return {
                    x: Math.round(pixel[0]),
                    y: Math.round(pixel[1])
                };
            }, [1188692.84, 6767643.28] as [number, number]);

            return clickPosition !== undefined;
        })
        .toBe(true);

    if (!clickPosition) {
        throw new Error('Could not resolve the target map coordinate to a clickable pixel position.');
    }

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThanOrEqual(mapBox.width);
    expect(clickPosition.y).toBeLessThanOrEqual(mapBox.height);

    const getFeatureInfoResponse = page.waitForResponse((response) => {
        return response.ok() && response.url().toLowerCase().includes('getfeatureinfo');
    });

    await mapContainer.click({ position: clickPosition });
    await getFeatureInfoResponse;

    await expect(infoPanel).toContainText(/UV-Index Station/i);
    await expect(infoPanel).toContainText(/EUCOS Ground Station/i);
});
