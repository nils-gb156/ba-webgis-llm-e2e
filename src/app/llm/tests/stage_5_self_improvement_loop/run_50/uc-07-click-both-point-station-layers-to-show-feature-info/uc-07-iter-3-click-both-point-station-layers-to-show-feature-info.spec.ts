// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const mapContainer = page.getByTestId('map-container');

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    await expect(infoPanelToggle).toBeVisible();
    if (!(await infoPanel.isVisible()) && (await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanel).toBeVisible();

    await expect(layerSwitcherToggle).toBeVisible();
    if (!(await layerSwitcher.isVisible()) && (await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcher).toBeVisible();

    await expect(measurementToggle).toBeVisible();
    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(async () => await measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

    const eucosCheckbox = page.getByRole('checkbox', {
        name: 'EUCOS Ground Stations',
        exact: true
    });
    await expect(eucosCheckbox).toBeVisible();
    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    await expect(eucosCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const uviCheckbox = page.getByRole('checkbox', {
        name: 'UV-Index Stations',
        exact: true
    });
    await expect(uviCheckbox).toBeVisible();
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }
    await expect(uviCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    await expect(mapContainer).toBeVisible();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getBaseClickPosition = async () =>
        await page.evaluate((coord) => {
            const map = (globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getPixelFromCoordinate?: (coordinate: number[]) => number[] | undefined;
                        getSize?: () => number[] | undefined;
                        getViewport?: () => HTMLElement | undefined;
                    };
                };
            }).__openPioneerMap;
            const pixel = map?.olMap?.getPixelFromCoordinate?.(coord);
            const size = map?.olMap?.getSize?.();
            const viewport = map?.olMap?.getViewport?.();
            const container = document.querySelector('[data-testid="map-container"]') as HTMLElement | null;

            if (
                !Array.isArray(pixel) ||
                pixel.length < 2 ||
                !Array.isArray(size) ||
                size.length < 2 ||
                !viewport ||
                !container
            ) {
                return undefined;
            }

            if (
                !Number.isFinite(pixel[0]) ||
                !Number.isFinite(pixel[1]) ||
                pixel[0] < 0 ||
                pixel[1] < 0 ||
                pixel[0] > size[0] ||
                pixel[1] > size[1]
            ) {
                return undefined;
            }

            const viewportRect = viewport.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const x = pixel[0] + (viewportRect.left - containerRect.left);
            const y = pixel[1] + (viewportRect.top - containerRect.top);

            if (
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                x < 0 ||
                y < 0 ||
                x > containerRect.width ||
                y > containerRect.height
            ) {
                return undefined;
            }

            return { x, y };
        }, targetCoordinate);

    await expect.poll(getBaseClickPosition, { timeout: 15000 }).not.toBeUndefined();

    const baseClickPosition = await getBaseClickPosition();
    if (!baseClickPosition) {
        throw new Error('Could not calculate a click position for the target map coordinate.');
    }

    const getInfoPanelText = async () => ((await infoPanel.textContent()) ?? '').replace(/\s+/g, ' ').trim();

    const hasBothStationSections = async () => {
        const text = await getInfoPanelText();
        return text.includes('UV-Index Station') && text.includes('EUCOS Ground Station');
    };

    const clickOffsets = [
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: 0, y: -2 },
        { x: 2, y: 0 },
        { x: -2, y: 0 },
        { x: 2, y: 2 },
        { x: -2, y: 2 },
        { x: 2, y: -2 },
        { x: -2, y: -2 },
        { x: 0, y: 4 },
        { x: 0, y: -4 },
        { x: 4, y: 0 },
        { x: -4, y: 0 }
    ];

    for (const offset of clickOffsets) {
        await mapContainer.click({
            position: {
                x: baseClickPosition.x + offset.x,
                y: baseClickPosition.y + offset.y
            }
        });

        try {
            await expect.poll(hasBothStationSections, { timeout: 5000 }).toBe(true);
            break;
        } catch {
            // Try the next nearby pixel to account for small hit-detection differences
            // between overlapping point layers.
        }
    }

    await expect.poll(hasBothStationSections, { timeout: 30000 }).toBe(true);

    await expect.poll(getInfoPanelText, { timeout: 30000 }).toMatch(/UV-Index Station/);
    await expect(page.getByTestId('uvi-station-section')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('uvi-station-info')).toContainText('Identifier', { timeout: 30000 });

    await expect.poll(getInfoPanelText, { timeout: 30000 }).toMatch(/EUCOS Ground Station/);
    await expect
        .poll(
            async () =>
                await infoPanel.evaluate((panel) => {
                    const normalized = (panel.textContent ?? '').replace(/\s+/g, ' ').trim();
                    const title = 'EUCOS Ground Station';
                    const titleIndex = normalized.indexOf(title);

                    if (titleIndex === -1) {
                        return 0;
                    }

                    return normalized.slice(titleIndex + title.length).trim().length;
                }),
            { timeout: 30000 }
        )
        .toBeGreaterThan(5);
});
