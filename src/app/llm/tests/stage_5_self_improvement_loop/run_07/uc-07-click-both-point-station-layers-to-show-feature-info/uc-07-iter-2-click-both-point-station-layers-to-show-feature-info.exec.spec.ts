// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const targetCoordinate: [number, number] = [1188692.84, 6767643.28];

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const initialExtentButton = page.getByTestId('initial-extent-button');
    const mapContainer = page.getByTestId('map-container');

    const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
    const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });

    const getClickablePixel = async (): Promise<{ x: number; y: number } | undefined> => {
        return await page.evaluate((coordinate) => {
            const map = (globalThis as any).__openPioneerMap;
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
            if (!Number.isFinite(x) || !Number.isFinite(y)) {
                return undefined;
            }

            if (x < 0 || y < 0 || x > size[0] || y > size[1]) {
                return undefined;
            }

            return { x: Math.round(x), y: Math.round(y) };
        }, targetCoordinate);
    };

    const getSectionContent = (
        text: string,
        heading: string,
        otherHeadings: string[]
    ): string | undefined => {
        const normalizedText = text.replace(/\s+/g, ' ').trim();
        const lowerText = normalizedText.toLowerCase();
        const headingLower = heading.toLowerCase();

        const startIndex = lowerText.indexOf(headingLower);
        if (startIndex === -1) {
            return undefined;
        }

        const contentStart = startIndex + heading.length;
        const nextHeadingIndices = otherHeadings
            .map((otherHeading) => lowerText.indexOf(otherHeading.toLowerCase(), contentStart))
            .filter((index) => index !== -1);

        const contentEnd =
            nextHeadingIndices.length > 0 ? Math.min(...nextHeadingIndices) : normalizedText.length;

        return normalizedText.slice(contentStart, contentEnd).trim();
    };

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    if ((await measurementToggle.getAttribute('aria-pressed')) === 'true') {
        await measurementToggle.click();
    }
    if ((await measurementToggle.getAttribute('aria-pressed')) !== null) {
        await expect(measurementToggle).toHaveAttribute('aria-pressed', 'false');
    }

    if (!(await eucosCheckbox.isChecked())) {
        await eucosCheckbox.click({ force: true });
    }
    if (!(await uviCheckbox.isChecked())) {
        await uviCheckbox.click({ force: true });
    }

    await expect(eucosCheckbox).toBeChecked();
    await expect(uviCheckbox).toBeChecked();

    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

    await initialExtentButton.click();

    await expect.poll(() => getClickablePixel()).toBeTruthy();
    const clickPosition = await getClickablePixel();

    if (!clickPosition) {
        throw new Error('Failed to convert the target map coordinate to a visible click position.');
    }

    const featureInfoResponse = page.waitForResponse((response) => {
        return response.url().toLowerCase().includes('getfeatureinfo') && response.ok();
    });

    await mapContainer.click({ position: clickPosition });
    await featureInfoResponse;

    const uviStationSection = infoPanel.getByText(/\bUV-Index Station\b/i);
    const eucosStationSection = infoPanel.getByText(/\bEUCOS Ground Station\b/i);

    await expect(uviStationSection).toBeVisible({ timeout: 15000 });
    await expect(eucosStationSection).toBeVisible({ timeout: 15000 });
    await expect(infoPanel.getByText('Click on the map to load a forecast.')).not.toBeVisible();

    await expect
        .poll(
            async () => {
                const text = (await infoPanel.textContent()) ?? '';

                const uviSectionContent = getSectionContent(text, 'UV-Index Station', [
                    'EUCOS Ground Station'
                ]);
                const eucosSectionContent = getSectionContent(text, 'EUCOS Ground Station', [
                    'UV-Index Station'
                ]);

                return Boolean(
                    uviSectionContent &&
                        uviSectionContent.length > 0 &&
                        eucosSectionContent &&
                        eucosSectionContent.length > 0
                );
            },
            { timeout: 15000 }
        )
        .toBe(true);
});
