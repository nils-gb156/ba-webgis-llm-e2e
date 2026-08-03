// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const initialExtentButton = page.getByTestId('initial-extent-button');
    const mapContainer = page.getByTestId('map-container');
    const uviStationSection = page.getByTestId('uvi-station-section');
    const uviStationInfo = page.getByTestId('uvi-station-info');
    const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];
    const coordinateTolerance = 100;

    const getClickablePixel = async (): Promise<{ x: number; y: number } | undefined> => {
        return await page.evaluate((coordinate) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            const size = map?.olMap?.getSize?.();

            if (
                !Array.isArray(pixel) ||
                pixel.length < 2 ||
                !Array.isArray(size) ||
                size.length < 2
            ) {
                return undefined;
            }

            const [x, y] = pixel;
            if (x < 0 || y < 0 || x > size[0] || y > size[1]) {
                return undefined;
            }

            return { x: Math.round(x), y: Math.round(y) };
        }, targetCoordinate);
    };

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressed === 'true') {
        await measurementToggle.click();
    }
    const measurementPressedAfter = await measurementToggle.getAttribute('aria-pressed');
    if (measurementPressedAfter !== null) {
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
    }

    await expect(eucosCheckbox).toBeChecked();
    await expect(uviCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    await expect.poll(() =>
        page.evaluate(([x, y]) => {
            const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
            const layers = map?.olMap?.getLayers?.()?.getArray?.() ?? [];
            const tolerance = 100;

            return layers.some((layer: any) => {
                const source = layer?.getSource?.();
                const features = source?.getFeatures?.();
                if (!Array.isArray(features) || features.length === 0) {
                    return false;
                }

                return features.some((feature: any) => {
                    const coordinates = feature?.getGeometry?.()?.getCoordinates?.();
                    return (
                        Array.isArray(coordinates) &&
                        coordinates.length >= 2 &&
                        Math.abs(coordinates[0] - x) <= tolerance &&
                        Math.abs(coordinates[1] - y) <= tolerance
                    );
                });
            });
        }, targetCoordinate),
        { timeout: 15000 }
    ).toBe(true);

    let clickPosition = await getClickablePixel();

    if (!clickPosition) {
        const moveEndPromise = page.evaluate(() => {
            return new Promise<void>((resolve) => {
                const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
                if (!map?.olMap?.once) {
                    resolve();
                    return;
                }
                map.olMap.once('moveend', () => resolve());
            });
        });

        await initialExtentButton.click();
        await moveEndPromise;

        await expect.poll(getClickablePixel).toBeTruthy();
        clickPosition = await getClickablePixel();
    }

    if (!clickPosition) {
        throw new Error('Failed to convert the target map coordinate to a visible click position.');
    }

    await mapContainer.click({ position: clickPosition });

    await expect.poll(async () => {
        const highlighted = await getHighlightedCoordinate(page);
        return (
            Array.isArray(highlighted) &&
            highlighted.length >= 2 &&
            Math.abs(highlighted[0] - targetCoordinate[0]) <= coordinateTolerance &&
            Math.abs(highlighted[1] - targetCoordinate[1]) <= coordinateTolerance
        );
    }).toBe(true);

    await expect(uviStationSection).toBeVisible({ timeout: 15000 });
    await expect(uviStationInfo).toBeVisible({ timeout: 15000 });
    await expect(infoPanel.getByText(/UV-Index Station/)).toBeVisible({ timeout: 15000 });
    await expect(infoPanel.getByText(/EUCOS Ground Station/)).toBeVisible({ timeout: 15000 });
});
