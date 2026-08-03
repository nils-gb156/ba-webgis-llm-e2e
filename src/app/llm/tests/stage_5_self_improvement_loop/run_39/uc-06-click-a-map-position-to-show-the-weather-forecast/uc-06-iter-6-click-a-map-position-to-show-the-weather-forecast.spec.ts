// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

function isForecastRequestUrl(url: string): boolean {
    return /(?:open-meteo|met\.no|weatherapi|\/forecast(?:[/?]|$)|\/weather(?:[-/?]|$))/i.test(url);
}

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecastHeading = page.getByRole('heading', { name: 'Weather Forecast', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(infoPanel.getByText('Click on the map to load a forecast.', { exact: true })).toBeVisible();

    const forecastRequests: string[] = [];
    const forecastResponses: Array<{ url: string; ok: boolean; status: number }> = [];

    page.on('request', (request) => {
        if (['fetch', 'xhr'].includes(request.resourceType()) && isForecastRequestUrl(request.url())) {
            forecastRequests.push(request.url());
        }
    });

    page.on('response', (response) => {
        const request = response.request();
        if (
            ['fetch', 'xhr'].includes(request.resourceType()) &&
            request.method() !== 'OPTIONS' &&
            isForecastRequestUrl(response.url())
        ) {
            forecastResponses.push({
                url: response.url(),
                ok: response.ok(),
                status: response.status()
            });
        }
    });

    const previousHighlight = await getHighlightedCoordinate(page);
    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.55),
            y: Math.round(mapBox.height * 0.4)
        }
    });

    await expect.poll(() => forecastRequests.length).toBeGreaterThan(0);
    await expect.poll(() => forecastResponses.some((response) => response.ok)).toBe(true);

    await expect.poll(() => getHighlightedCoordinate(page), { timeout: 10000 }).not.toBeUndefined();

    if (previousHighlight !== undefined) {
        await expect
            .poll(async () => JSON.stringify(await getHighlightedCoordinate(page)), { timeout: 10000 })
            .not.toBe(JSON.stringify(previousHighlight));
    }

    const readForecastState = async () =>
        await infoPanel.evaluate((panel) => {
            const root = panel as HTMLElement;
            const text = (root.innerText || '').replace(/\s+/g, ' ').trim();
            const hasPlaceholder = text.includes('Click on the map to load a forecast.');
            const hasError = text.includes('Fehler beim Laden der Wetterdaten');

            const counts: number[] = [];

            for (const tbody of Array.from(root.querySelectorAll('tbody'))) {
                const rowCount = tbody.querySelectorAll('tr').length;
                if (rowCount > 0) {
                    counts.push(rowCount);
                }
            }

            for (const table of Array.from(root.querySelectorAll('table'))) {
                const rows = Array.from(table.querySelectorAll('tr'));
                if (rows.length > 0) {
                    const headerRows = rows.filter((row) => row.querySelector('th,[role="columnheader"]')).length;
                    const dataRows = rows.length - Math.min(headerRows, 1);
                    if (dataRows > 0) {
                        counts.push(dataRows);
                    }
                }
            }

            for (const grid of Array.from(root.querySelectorAll('[role="table"], [role="grid"]'))) {
                const rows = grid.querySelectorAll('[role="row"]').length;
                const headerRows = grid.querySelectorAll('[role="columnheader"]').length > 0 ? 1 : 0;
                const dataRows = rows - headerRows;
                if (dataRows > 0) {
                    counts.push(dataRows);
                }
            }

            for (const list of Array.from(root.querySelectorAll('ul, ol, [role="list"]'))) {
                const itemCount = list.querySelectorAll(':scope > li, :scope > [role="listitem"]').length;
                if (itemCount > 0) {
                    counts.push(itemCount);
                }
            }

            const exactNodeTexts = Array.from(root.querySelectorAll('*'))
                .map((element) => (element as HTMLElement).innerText?.trim() ?? '')
                .filter(Boolean);

            const exactTimeLabels = new Set(
                exactNodeTexts
                    .filter(
                        (value) =>
                            /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) ||
                            /^(?:[1-9]|1[0-2])(?::[0-5]\d)?\s?(?:AM|PM)$/i.test(value) ||
                            /^(?:[01]?\d|2[0-3])\s?Uhr$/i.test(value) ||
                            /^\d{4}-\d{2}-\d{2}[ T](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?Z?$/.test(value)
                    )
                    .map((value) => value.toLowerCase())
            ).size;

            if (exactTimeLabels > 0) {
                counts.push(exactTimeLabels);
            }

            const inlinePatterns = [
                /\b(?:[01]\d|2[0-3]):[0-5]\d\b/g,
                /\b(?:[1-9]|1[0-2])(?::[0-5]\d)?\s?(?:AM|PM)\b/gi,
                /\b(?:[01]?\d|2[0-3])\s?Uhr\b/gi,
                /\b\d{4}-\d{2}-\d{2}[ T](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?Z?\b/g
            ];

            for (const pattern of inlinePatterns) {
                const matches = text.match(pattern) ?? [];
                const uniqueCount = new Set(matches.map((value) => value.toLowerCase())).size;
                if (uniqueCount > 0) {
                    counts.push(uniqueCount);
                }
            }

            const entryCount = counts.find((count) => count === 24) ?? counts.sort((a, b) => b - a)[0];

            return {
                text,
                hasPlaceholder,
                hasError,
                entryCount
            };
        });

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();

    await expect
        .poll(readForecastState, { timeout: 20000 })
        .toEqual(
            expect.objectContaining({
                hasPlaceholder: false,
                hasError: false,
                entryCount: 24
            })
        );
});
