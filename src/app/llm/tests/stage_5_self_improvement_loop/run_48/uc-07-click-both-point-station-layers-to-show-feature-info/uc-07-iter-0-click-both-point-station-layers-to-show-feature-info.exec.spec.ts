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
        const pressed = await layerSwitcherToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        const pressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
    }

    const uviStationsCheckbox = page.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    if (!(await uviStationsCheckbox.isChecked())) {
        await uviStationsCheckbox.click({ force: true });
    }
    await expect(uviStationsCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    const eucosStationsCheckbox = page.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    if (!(await eucosStationsCheckbox.isChecked())) {
        await eucosStationsCheckbox.click({ force: true });
    }
    await expect(eucosStationsCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    let clickPosition: { x: number; y: number } | undefined;
    await expect
        .poll(async () => {
            clickPosition = await page.evaluate((coordinate) => {
                const browserWindow = globalThis as typeof globalThis & {
                    __openPioneerMap?: {
                        olMap?: {
                            getPixelFromCoordinate?: (
                                coords: [number, number]
                            ) => [number, number] | number[] | undefined;
                        };
                    };
                };

                const pixel = browserWindow.__openPioneerMap?.olMap?.getPixelFromCoordinate?.(
                    coordinate as [number, number]
                );

                if (!Array.isArray(pixel) || pixel.length < 2) {
                    return undefined;
                }

                const [x, y] = pixel;
                if (
                    typeof x !== 'number' ||
                    typeof y !== 'number' ||
                    Number.isNaN(x) ||
                    Number.isNaN(y)
                ) {
                    return undefined;
                }

                return { x: Math.round(x), y: Math.round(y) };
            }, [1188692.84, 6767643.28] as [number, number]);

            return clickPosition ? `${clickPosition.x},${clickPosition.y}` : undefined;
        })
        .toMatch(/^-?\d+,-?\d+$/);

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox || !clickPosition) {
        throw new Error('Could not determine a clickable map position for the target coordinate.');
    }

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThan(mapBox.width);
    expect(clickPosition.y).toBeLessThan(mapBox.height);

    await mapContainer.click({ position: clickPosition });

    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');
});
