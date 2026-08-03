// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter, getMapZoomLevel } from '../../../../map-model-helpers';

function isForecastRequestUrl(url: string): boolean {
    const normalized = url.toLowerCase();
    return (
        normalized.includes('open-meteo') ||
        normalized.includes('met.no') ||
        normalized.includes('/forecast') ||
        normalized.includes('weather-forecast') ||
        normalized.includes('/weather?') ||
        normalized.includes('/weather/')
    );
}

function extractForecastEntryCount(data: unknown): number | undefined {
    if (Array.isArray(data)) {
        const nestedCounts = data
            .map((item) => extractForecastEntryCount(item))
            .filter((value): value is number => typeof value === 'number');

        return nestedCounts.find((count) => count === 24) ?? nestedCounts[0];
    }

    if (!data || typeof data !== 'object') {
        return undefined;
    }

    const record = data as Record<string, unknown>;

    if (record.hourly && typeof record.hourly === 'object') {
        const hourly = record.hourly as Record<string, unknown>;

        if (Array.isArray(hourly.time)) {
            return hourly.time.length;
        }

        const hourlyArray = Object.values(hourly).find((value) => Array.isArray(value));
        if (Array.isArray(hourlyArray)) {
            return hourlyArray.length;
        }
    }

    const directCandidates = [
        record.time,
        record.timeseries,
        record.forecast,
        record.entries,
        record.items,
        record.list
    ];

    for (const candidate of directCandidates) {
        if (Array.isArray(candidate)) {
            return candidate.length;
        }
    }

    const nestedCounts = Object.values(record)
        .map((value) => extractForecastEntryCount(value))
        .filter((value): value is number => typeof value === 'number');

    return nestedCounts.find((count) => count === 24) ?? nestedCounts[0];
}

async function getWeatherForecastRenderState(page: any): Promise<{
    text: string;
    entryCount?: number;
    hasError: boolean;
    hasPlaceholder: boolean;
}> {
    return page.evaluate(() => {
        const section = document.querySelector('[data-testid="weather-forecast-section"]');

        if (!section) {
            return {
                text: '',
                entryCount: undefined,
                hasError: false,
                hasPlaceholder: false
            };
        }

        const text = (section.textContent ?? '').replace(/\s+/g, ' ').trim();
        const hasError = text.includes('Fehler beim Laden der Wetterdaten');
        const hasPlaceholder = text.includes('Click on the map to load a forecast.');

        let entryCount: number | undefined;

        const tbodyRowCounts = Array.from(section.querySelectorAll('tbody'))
            .map((tbody) => tbody.querySelectorAll('tr').length)
            .filter((count) => count > 0);

        if (tbodyRowCounts.length > 0) {
            entryCount = Math.max(...tbodyRowCounts);
        }

        if (entryCount === undefined) {
            const tableRowCounts = Array.from(section.querySelectorAll('table'))
                .map((table) => {
                    const rows = table.querySelectorAll('tr').length;
                    return rows > 1 ? rows - 1 : 0;
                })
                .filter((count) => count > 0);

            if (tableRowCounts.length > 0) {
                entryCount = Math.max(...tableRowCounts);
            }
        }

        if (entryCount === undefined) {
            const listItemCount = section.querySelectorAll('[role="listitem"], li').length;
            if (listItemCount > 0) {
                entryCount = listItemCount;
            }
        }

        if (entryCount === undefined) {
            const rowCount = section.querySelectorAll('[role="row"]').length;
            if (rowCount > 1) {
                entryCount = rowCount - 1;
            }
        }

        if (entryCount === undefined) {
            const accordionButtonCount = section.querySelectorAll('button[aria-expanded]').length;
            if (accordionButtonCount > 0) {
                entryCount = accordionButtonCount;
            }
        }

        if (entryCount === undefined) {
            const timeMatches = text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g) ?? [];
            const uhrMatches = text.match(/\b(?:[01]?\d|2[0-3])\s?Uhr\b/g) ?? [];
            const uniqueTimeLabels = new Set([...timeMatches, ...uhrMatches]).size;

            if (uniqueTimeLabels > 0) {
                entryCount = uniqueTimeLabels;
            }
        }

        return {
            text,
            entryCount,
            hasError,
            hasPlaceholder
        };
    });
}

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecastHeading = page.getByRole('heading', { name: 'Weather Forecast', exact: true });

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        } else {
            await expect(infoPanel).toBeVisible();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const forecastRequestUrls: string[] = [];
    page.on('request', (request) => {
        if (!['fetch', 'xhr'].includes(request.resourceType())) {
            return;
        }

        if (isForecastRequestUrl(request.url())) {
            forecastRequestUrls.push(request.url());
        }
    });

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const candidatePositions = [
        { x: Math.round(mapBox.width * 0.63), y: Math.round(mapBox.height * 0.34) },
        { x: Math.round(mapBox.width * 0.58), y: Math.round(mapBox.height * 0.58) },
        { x: Math.round(mapBox.width * 0.70), y: Math.round(mapBox.height * 0.52) },
        { x: Math.round(mapBox.width * 0.66), y: Math.round(mapBox.height * 0.70) }
    ].map((position) => ({
        x: Math.min(Math.max(position.x, 320), Math.round(mapBox.width - 320)),
        y: Math.min(Math.max(position.y, 120), Math.round(mapBox.height - 140))
    }));

    let previousHighlightKey = JSON.stringify(await getHighlightedCoordinate(page));
    let successfulRequestUrl: string | undefined;
    let successfulResponseEntryCount: number | undefined;
    let successfulRenderedEntryCount: number | undefined;

    for (const position of candidatePositions) {
        const requestCountBeforeClick = forecastRequestUrls.length;
        const responsePromise = page
            .waitForResponse(
                (response) =>
                    ['fetch', 'xhr'].includes(response.request().resourceType()) &&
                    isForecastRequestUrl(response.url()),
                { timeout: 10000 }
            )
            .catch(() => null);

        await mapContainer.click({ position });

        await expect
            .poll(async () => JSON.stringify(await getHighlightedCoordinate(page)), { timeout: 5000 })
            .not.toBe(previousHighlightKey);

        previousHighlightKey = JSON.stringify(await getHighlightedCoordinate(page));

        await expect.poll(() => forecastRequestUrls.length, { timeout: 10000 }).toBeGreaterThan(requestCountBeforeClick);

        successfulRequestUrl = forecastRequestUrls[forecastRequestUrls.length - 1];

        const response = await responsePromise;
        let responseEntryCount: number | undefined;

        if (response?.ok()) {
            try {
                responseEntryCount = extractForecastEntryCount(await response.json());
            } catch {
                responseEntryCount = undefined;
            }
        }

        try {
            await expect
                .poll(
                    async () => {
                        const state = await getWeatherForecastRenderState(page);

                        if (state.hasError) {
                            return 'error';
                        }

                        if (state.entryCount === 24) {
                            return 'loaded-24';
                        }

                        if (!state.hasPlaceholder && state.text.length > 0) {
                            return 'loaded';
                        }

                        return 'placeholder';
                    },
                    { timeout: 10000 }
                )
                .not.toBe('placeholder');
        } catch {
            continue;
        }

        const state = await getWeatherForecastRenderState(page);

        if (state.hasError) {
            continue;
        }

        if (state.entryCount === 24 || responseEntryCount === 24) {
            successfulRenderedEntryCount = state.entryCount;
            successfulResponseEntryCount = responseEntryCount;
            break;
        }
    }

    expect(successfulRequestUrl).toBeTruthy();
    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecastSection).not.toContainText('Fehler beim Laden der Wetterdaten');

    const finalState = await getWeatherForecastRenderState(page);

    if (finalState.entryCount !== undefined) {
        await expect.poll(() => getWeatherForecastRenderState(page).then((state: any) => state.entryCount)).toBe(24);
    } else {
        expect(successfulRenderedEntryCount === 24 || successfulResponseEntryCount === 24).toBe(true);
        expect(successfulResponseEntryCount).toBe(24);
    }
});
