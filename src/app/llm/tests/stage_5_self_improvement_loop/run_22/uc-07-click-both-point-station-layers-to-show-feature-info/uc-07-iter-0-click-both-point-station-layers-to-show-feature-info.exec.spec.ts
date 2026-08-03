// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const mapContainer = page.getByTestId('map-container');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const initialExtentButton = page.getByTestId('initial-extent-button');

    const eucosCheckbox = page.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    const uviCheckbox = page.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });

    const getClickPosition = async (): Promise<{ x: number; y: number } | null> => {
        return await page.evaluate((coordinate) => {
            const map = (globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getPixelFromCoordinate?: (coord: [number, number]) => number[] | undefined;
                        getSize?: () => number[] | undefined;
                    };
                };
            }).__openPioneerMap;

            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            const size = map?.olMap?.getSize?.();

            if (!pixel || !size || pixel.length < 2 || size.length < 2) {
                return null;
            }

            if (pixel[0] < 0 || pixel[1] < 0 || pixel[0] > size[0] || pixel[1] > size[1]) {
                return null;
            }

            return {
                x: Math.round(pixel[0]),
                y: Math.round(pixel[1])
            };
        }, coordinate);
    };

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(() => measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();

    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    await initialExtentButton.click();

    await expect.poll(async () => (await getClickPosition()) !== null).toBe(true);

    const initialInfoPanelTextLength = (await infoPanel.textContent())?.length ?? 0;
    const clickPosition = await getClickPosition();

    if (!clickPosition) {
        throw new Error('Target map coordinate is not visible in the current map extent.');
    }

    await mapContainer.click({
        position: {
            x: clickPosition.x,
            y: clickPosition.y
        }
    });

    await expect.poll(async () => (await infoPanel.textContent())?.length ?? 0).toBeGreaterThan(initialInfoPanelTextLength);
    await expect(infoPanel).toContainText('UV-Index Station');
    await expect(infoPanel).toContainText('EUCOS Ground Station');
});
