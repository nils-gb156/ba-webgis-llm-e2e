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
    const initialExtentButton = page.getByTestId('initial-extent-button');
    const mapViewport = page.getByTestId('map-container').locator('.ol-viewport');

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    await expect(infoPanelToggle).toBeVisible();
    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    await expect(layerSwitcherToggle).toBeVisible();
    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    await expect(measurementToggle).toBeVisible();
    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    await expect.poll(() => measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

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

    await expect(initialExtentButton).toBeVisible();
    await initialExtentButton.click();

    await expect(mapViewport).toBeVisible();

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const getMapPixel = async () =>
        await page.evaluate((coordinate) => {
            const map = (globalThis as {
                __openPioneerMap?: {
                    olMap?: {
                        getPixelFromCoordinate?: (coord: number[]) => number[] | undefined;
                        getSize?: () => number[] | undefined;
                    };
                };
            }).__openPioneerMap;

            const pixel = map?.olMap?.getPixelFromCoordinate?.(coordinate);
            const size = map?.olMap?.getSize?.();

            if (
                !Array.isArray(pixel) ||
                pixel.length < 2 ||
                !Array.isArray(size) ||
                size.length < 2 ||
                !Number.isFinite(pixel[0]) ||
                !Number.isFinite(pixel[1]) ||
                !Number.isFinite(size[0]) ||
                !Number.isFinite(size[1])
            ) {
                return undefined;
            }

            if (pixel[0] < 0 || pixel[1] < 0 || pixel[0] >= size[0] || pixel[1] >= size[1]) {
                return undefined;
            }

            return {
                x: Math.round(pixel[0]),
                y: Math.round(pixel[1]),
                width: Math.round(size[0]),
                height: Math.round(size[1])
            };
        }, targetCoordinate);

    await expect.poll(getMapPixel, { timeout: 30000 }).not.toBeUndefined();

    const normalizeWhitespace = (value: string | null) => (value ?? '').replace(/\s+/g, ' ').trim();

    const getInfoPanelAnalysis = async () => {
        const text = normalizeWhitespace(await infoPanel.textContent());
        const sectionTitles = ['UV-Index Station', 'EUCOS Ground Station'];

        const getSectionDetailLength = (title: string) => {
            const startIndex = text.indexOf(title);
            if (startIndex === -1) {
                return 0;
            }

            const contentStart = startIndex + title.length;
            const delimiterIndexes = [
                ...sectionTitles
                    .filter((candidate) => candidate !== title)
                    .map((candidate) => text.indexOf(candidate, contentStart)),
                text.indexOf('Weather Forecast', contentStart),
                text.indexOf('Information', contentStart)
            ].filter((index) => index !== -1);

            const contentEnd = delimiterIndexes.length > 0 ? Math.min(...delimiterIndexes) : text.length;
            return text.slice(contentStart, contentEnd).trim().length;
        };

        return {
            text,
            hasUVISection: text.includes('UV-Index Station'),
            hasEUCOSSection: text.includes('EUCOS Ground Station'),
            uviDetailLength: getSectionDetailLength('UV-Index Station'),
            eucosDetailLength: getSectionDetailLength('EUCOS Ground Station')
        };
    };

    const clickOffsets = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 2, y: 0 },
        { x: -2, y: 0 },
        { x: 0, y: 2 },
        { x: 0, y: -2 },
        { x: 3, y: 0 },
        { x: -3, y: 0 },
        { x: 0, y: 3 },
        { x: 0, y: -3 }
    ];

    for (const offset of clickOffsets) {
        const pixel = await getMapPixel();
        if (!pixel) {
            continue;
        }

        const clickX = Math.min(Math.max(pixel.x + offset.x, 1), pixel.width - 2);
        const clickY = Math.min(Math.max(pixel.y + offset.y, 1), pixel.height - 2);

        await mapViewport.click({
            position: {
                x: clickX,
                y: clickY
            }
        });

        try {
            await expect.poll(async () => (await getInfoPanelAnalysis()).hasUVISection, { timeout: 7000 }).toBe(true);
            await expect.poll(async () => (await getInfoPanelAnalysis()).hasEUCOSSection, { timeout: 7000 }).toBe(true);
            break;
        } catch {
            // Retry nearby pixels to account for hit-detection differences on overlapping point layers.
        }
    }

    await expect.poll(async () => (await getInfoPanelAnalysis()).hasUVISection, { timeout: 30000 }).toBe(true);
    await expect.poll(async () => (await getInfoPanelAnalysis()).uviDetailLength, { timeout: 30000 }).toBeGreaterThan(5);

    await expect.poll(async () => (await getInfoPanelAnalysis()).hasEUCOSSection, { timeout: 30000 }).toBe(true);
    await expect.poll(async () => (await getInfoPanelAnalysis()).eucosDetailLength, { timeout: 30000 }).toBeGreaterThan(5);

    await expect.poll(async () => (await getInfoPanelAnalysis()).text, { timeout: 30000 }).toMatch(/UV-Index Station/);
    await expect.poll(async () => (await getInfoPanelAnalysis()).text, { timeout: 30000 }).toMatch(/EUCOS Ground Station/);
});
