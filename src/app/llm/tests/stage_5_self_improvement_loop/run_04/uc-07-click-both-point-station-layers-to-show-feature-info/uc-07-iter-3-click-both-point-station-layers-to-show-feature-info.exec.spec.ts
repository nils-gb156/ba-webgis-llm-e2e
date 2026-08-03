// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

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
    await page.waitForLoadState('networkidle');

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    let targetPixel: { x: number; y: number } | undefined;
    await expect
        .poll(
            async () => {
                targetPixel = await page.evaluate(([x, y]) => {
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
                return targetPixel !== undefined;
            },
            { timeout: 30000 }
        )
        .toBe(true);

    let viewportOrigin: { x: number; y: number } | undefined;
    await expect
        .poll(
            async () => {
                viewportOrigin = await page.evaluate(() => {
                    const map = (globalThis as {
                        __openPioneerMap?: {
                            olMap?: {
                                getViewport?: () => HTMLElement | undefined;
                            };
                        };
                    }).__openPioneerMap;

                    const viewport = map?.olMap?.getViewport?.();
                    if (!viewport) {
                        return undefined;
                    }

                    const rect = viewport.getBoundingClientRect();
                    return { x: rect.left, y: rect.top };
                });
                return viewportOrigin !== undefined;
            },
            { timeout: 30000 }
        )
        .toBe(true);

    const mapContainerBox = await mapContainer.boundingBox();
    expect(mapContainerBox).not.toBeNull();

    if (!mapContainerBox || !targetPixel || !viewportOrigin) {
        throw new Error('Could not determine the map click position for the target coordinate.');
    }

    const clickPosition = {
        x: targetPixel.x + (viewportOrigin.x - mapContainerBox.x),
        y: targetPixel.y + (viewportOrigin.y - mapContainerBox.y)
    };

    expect(clickPosition.x).toBeGreaterThanOrEqual(0);
    expect(clickPosition.y).toBeGreaterThanOrEqual(0);
    expect(clickPosition.x).toBeLessThan(mapContainerBox.width);
    expect(clickPosition.y).toBeLessThan(mapContainerBox.height);

    let getFeatureInfoRequestUrl: string | undefined;
    page.on('request', (request) => {
        if (/getfeatureinfo/i.test(request.url())) {
            getFeatureInfoRequestUrl = request.url();
        }
    });

    const getFeatureInfoResponse = page.waitForResponse(
        (response) => /getfeatureinfo/i.test(response.url()) && response.ok()
    );

    await mapContainer.click({ position: clickPosition });
    await getFeatureInfoResponse;

    await expect.poll(() => getFeatureInfoRequestUrl ?? '', { timeout: 30000 }).toMatch(/getfeatureinfo/i);

    await expect
        .poll(
            async () => {
                const highlighted = await getHighlightedCoordinate(page);
                return highlighted
                    ? Math.hypot(
                          highlighted[0] - targetCoordinate[0],
                          highlighted[1] - targetCoordinate[1]
                      )
                    : Number.POSITIVE_INFINITY;
            },
            { timeout: 30000 }
        )
        .toBeLessThan(1);

    const uviStationSection = page.getByTestId('uvi-station-section');
    const uviStationInfo = page.getByTestId('uvi-station-info');

    await expect(uviStationSection).toContainText('UV-Index Station', { timeout: 30000 });
    await expect(uviStationInfo).toContainText(/Identifier|Name/, { timeout: 30000 });

    await expect
        .poll(async () => (await infoPanel.textContent()) ?? '', { timeout: 30000 })
        .toMatch(/EUCOS Ground Station\s+\S+/);
});
