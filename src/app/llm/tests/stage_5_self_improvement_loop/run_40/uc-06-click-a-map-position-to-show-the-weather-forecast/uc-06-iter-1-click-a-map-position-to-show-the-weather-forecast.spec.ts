// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecastHeading = infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true });
    const placeholderText = weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true });
    const errorText = weatherForecastSection.getByText('Fehler beim Laden der Wetterdaten', { exact: true });

    const getForecastState = async (): Promise<{
        entryCount: number;
        hasPlaceholder: boolean;
        hasError: boolean;
    }> => {
        return await weatherForecastSection.evaluate((section) => {
            const isVisible = (element: Element): boolean => {
                const htmlElement = element as HTMLElement;
                return !htmlElement.hidden && htmlElement.getClientRects().length > 0;
            };

            const textContent = section.textContent ?? '';
            const allNodes = [section, ...Array.from(section.querySelectorAll('*'))];
            const visibleChildGroupCounts = allNodes.map(
                (node) => Array.from(node.children).filter(isVisible).length
            );

            const listItemCount = Array.from(section.querySelectorAll('li, [role="listitem"]')).filter(isVisible).length;
            const articleCount = Array.from(section.querySelectorAll('article')).filter(isVisible).length;
            const rowCount = Array.from(section.querySelectorAll('tbody > tr, [role="row"]')).filter(isVisible).length;
            const imageCount = Array.from(section.querySelectorAll('img')).filter(isVisible).length;

            const entryCount = [listItemCount, articleCount, rowCount, imageCount, ...visibleChildGroupCounts].includes(24)
                ? 24
                : 0;

            return {
                entryCount,
                hasPlaceholder: /Click on the map to load a forecast\./i.test(textContent),
                hasError: /Fehler beim Laden der Wetterdaten/i.test(textContent)
            };
        });
    };

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(placeholderText).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const candidatePositions = [
        { x: Math.round(mapBox.width * 0.76), y: Math.round(mapBox.height * 0.74) },
        { x: Math.round(mapBox.width * 0.72), y: Math.round(mapBox.height * 0.68) },
        { x: Math.round(mapBox.width * 0.80), y: Math.round(mapBox.height * 0.70) },
        { x: Math.round(mapBox.width * 0.64), y: Math.round(mapBox.height * 0.58) },
        { x: Math.round(mapBox.width * 0.58), y: Math.round(mapBox.height * 0.66) }
    ];

    let forecastLoaded = false;

    for (const position of candidatePositions) {
        const previousHighlight = await getHighlightedCoordinate(page);

        await mapContainer.click({ position });

        await expect.poll(async () => {
            const currentHighlight = await getHighlightedCoordinate(page);
            if (!currentHighlight) {
                return false;
            }

            if (!previousHighlight) {
                return true;
            }

            return (
                currentHighlight[0] !== previousHighlight[0] ||
                currentHighlight[1] !== previousHighlight[1]
            );
        }).toBe(true);

        try {
            await expect.poll(async () => {
                const state = await getForecastState();
                return state.entryCount;
            }, { timeout: 12000 }).toBe(24);

            forecastLoaded = true;
            break;
        } catch {
            // Try another valid map position if this location does not return forecast data.
        }
    }

    expect(forecastLoaded).toBe(true);

    await expect.poll(async () => {
        const highlight = await getHighlightedCoordinate(page);
        return Boolean(highlight);
    }).toBe(true);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(placeholderText).not.toBeVisible();
    await expect(errorText).not.toBeVisible();

    await expect.poll(async () => {
        const state = await getForecastState();
        return state.entryCount;
    }).toBe(24);
});
