// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

function extractForecastEntryCount(data: unknown): number | undefined {
    if (Array.isArray(data)) {
        if (data.length === 24) {
            return 24;
        }

        for (const item of data) {
            const nestedCount = extractForecastEntryCount(item);
            if (nestedCount === 24) {
                return 24;
            }
        }

        return undefined;
    }

    if (!data || typeof data !== 'object') {
        return undefined;
    }

    const record = data as Record<string, unknown>;

    if (record.hourly && typeof record.hourly === 'object') {
        const hourly = record.hourly as Record<string, unknown>;

        if (Array.isArray(hourly.time) && hourly.time.length === 24) {
            return 24;
        }

        for (const value of Object.values(hourly)) {
            if (Array.isArray(value) && value.length === 24) {
                return 24;
            }
        }
    }

    if (Array.isArray(record.list) && record.list.length === 24) {
        return 24;
    }

    if (Array.isArray(record.forecast) && record.forecast.length === 24) {
        return 24;
    }

    if (Array.isArray(record.entries) && record.entries.length === 24) {
        return 24;
    }

    for (const value of Object.values(record)) {
        const nestedCount = extractForecastEntryCount(value);
        if (nestedCount === 24) {
            return 24;
        }
    }

    return undefined;
}

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const initialSectionText = ((await weatherForecastSection.textContent()) ?? '').trim();
    let previousHighlightKey = JSON.stringify(await getHighlightedCoordinate(page));

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const candidatePositions = [
        { x: Math.round(mapBox.width * 0.55), y: Math.round(mapBox.height * 0.45) },
        { x: Math.round(mapBox.width * 0.65), y: Math.round(mapBox.height * 0.30) },
        { x: Math.round(mapBox.width * 0.45), y: Math.round(mapBox.height * 0.60) },
        { x: Math.round(mapBox.width * 0.58), y: Math.round(mapBox.height * 0.72) }
    ].map((position) => ({
        x: Math.min(Math.max(position.x, 80), Math.round(mapBox.width - 80)),
        y: Math.min(Math.max(position.y, 80), Math.round(mapBox.height - 80))
    }));

    let successfulForecastEntryCount: number | undefined;

    for (const position of candidatePositions) {
        let attemptForecastEntryCount: number | undefined;

        const forecastResponsePromise = page
            .waitForResponse(
                async (response) => {
                    const request = response.request();
                    if (!['xhr', 'fetch'].includes(request.resourceType())) {
                        return false;
                    }

                    const url = response.url().toLowerCase();
                    if (
                        !url.includes('forecast') &&
                        !url.includes('weather') &&
                        !url.includes('open-meteo') &&
                        !url.includes('met.no')
                    ) {
                        return false;
                    }

                    if (!response.ok()) {
                        return false;
                    }

                    try {
                        const data = await response.json();
                        const entryCount = extractForecastEntryCount(data);
                        if (entryCount === 24) {
                            attemptForecastEntryCount = entryCount;
                            return true;
                        }
                    } catch {
                        return false;
                    }

                    return false;
                },
                { timeout: 15000 }
            )
            .catch(() => null);

        await mapContainer.click({ position });

        await expect
            .poll(
                async () => JSON.stringify(await getHighlightedCoordinate(page)),
                { timeout: 5000 }
            )
            .not.toBe(previousHighlightKey);

        previousHighlightKey = JSON.stringify(await getHighlightedCoordinate(page));

        const forecastResponse = await forecastResponsePromise;
        if (forecastResponse && attemptForecastEntryCount === 24) {
            successfulForecastEntryCount = attemptForecastEntryCount;
            break;
        }
    }

    if (successfulForecastEntryCount !== 24) {
        throw new Error('No successful weather forecast response with 24 entries was received after clicking the map.');
    }

    await expect.poll(async () => ((await weatherForecastSection.textContent()) ?? '').trim()).not.toBe(initialSectionText);
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecastSection).not.toContainText('Fehler beim Laden der Wetterdaten');
    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    expect(successfulForecastEntryCount).toBe(24);
});
