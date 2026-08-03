// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecastHeading = infoPanel.getByRole('heading', {
        name: 'Weather Forecast',
        exact: true
    });

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(
        infoPanel.getByText('Click on the map to load a forecast.', { exact: true })
    ).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const readForecastState = async (): Promise<{
        text: string;
        hasPlaceholder: boolean;
        hasError: boolean;
        entryCount: number;
    }> =>
        await weatherForecastSection.evaluate((section) => {
            const root = section as HTMLElement;
            const text = (root.innerText ?? '').replace(/\s+/g, ' ').trim();
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
                    const headerRows = rows.filter((row) =>
                        row.querySelector('th,[role="columnheader"]')
                    ).length;
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

            const entryCount = counts.includes(24) ? 24 : counts.length > 0 ? Math.max(...counts) : 0;

            return {
                text,
                hasPlaceholder,
                hasError,
                entryCount
            };
        });

    const candidatePositions = [
        { x: Math.round(mapBox.width * 0.5), y: Math.round(mapBox.height * 0.5) },
        { x: Math.round(mapBox.width * 0.55), y: Math.round(mapBox.height * 0.4) },
        { x: Math.round(mapBox.width * 0.62), y: Math.round(mapBox.height * 0.48) },
        { x: Math.round(mapBox.width * 0.44), y: Math.round(mapBox.height * 0.58) },
        { x: Math.round(mapBox.width * 0.7), y: Math.round(mapBox.height * 0.36) }
    ];

    let successfulForecast:
        | {
              text: string;
              hasPlaceholder: boolean;
              hasError: boolean;
              entryCount: number;
          }
        | undefined;
    let lastForecastState = await readForecastState();

    for (const position of candidatePositions) {
        const previousHighlight = await getHighlightedCoordinate(page);

        const requestPromise = page
            .waitForRequest(
                (request) =>
                    ['fetch', 'xhr'].includes(request.resourceType()) && request.method() !== 'OPTIONS',
                { timeout: 15000 }
            )
            .catch(() => undefined);

        const responsePromise = page
            .waitForResponse(
                (response) =>
                    ['fetch', 'xhr'].includes(response.request().resourceType()) &&
                    response.request().method() !== 'OPTIONS',
                { timeout: 15000 }
            )
            .catch(() => undefined);

        await mapContainer.click({ position });

        await expect.poll(() => getHighlightedCoordinate(page), { timeout: 10000 }).not.toBeUndefined();

        if (previousHighlight !== undefined) {
            await expect
                .poll(async () => JSON.stringify(await getHighlightedCoordinate(page)), { timeout: 10000 })
                .not.toBe(JSON.stringify(previousHighlight));
        }

        const request = await requestPromise;
        expect(request).toBeTruthy();

        await responsePromise;

        await expect
            .poll(async () => {
                const state = await readForecastState();
                lastForecastState = state;

                if (!state.hasPlaceholder && !state.hasError && state.entryCount === 24) {
                    return 'success';
                }

                if (state.hasError) {
                    return 'error';
                }

                return 'loading';
            }, { timeout: 20000 })
            .toMatch(/success|error/);

        if (!lastForecastState.hasPlaceholder && !lastForecastState.hasError && lastForecastState.entryCount === 24) {
            successfulForecast = lastForecastState;
            break;
        }
    }

    if (!successfulForecast) {
        throw new Error(
            `Weather forecast did not load successfully after clicking candidate map positions. Last state: ${JSON.stringify(
                lastForecastState
            )}`
        );
    }

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    expect(successfulForecast.hasPlaceholder).toBe(false);
    expect(successfulForecast.hasError).toBe(false);
    expect(successfulForecast.entryCount).toBe(24);
});
