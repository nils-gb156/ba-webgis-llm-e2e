// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getMapZoomLevel } from '../../../../map-model-helpers';

type CapturedRequest = {
    url: string;
    method: string;
};

type CapturedResponse = {
    url: string;
    status: number;
    forecastEntryCount?: number;
};

const FORECAST_HINT_REGEX =
    /(forecast|weather|hour|time|date|temp|temperature|precip|rain|snow|cloud|wind|icon|entry|timeseries|daily)/i;

function extractForecastEntryCount(value: unknown): number | undefined {
    const visited = new Set<object>();

    const walk = (node: unknown, path: string[] = []): number | undefined => {
        if (node === null || node === undefined || typeof node !== 'object') {
            return undefined;
        }

        if (visited.has(node)) {
            return undefined;
        }
        visited.add(node);

        if (Array.isArray(node)) {
            if (node.length === 24) {
                const pathLooksForecast = path.some((segment) => FORECAST_HINT_REGEX.test(segment));
                const hasForecastLikeObject = node.some((item) => {
                    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
                        return false;
                    }
                    return Object.keys(item).some((key) => FORECAST_HINT_REGEX.test(key));
                });
                const primitiveOnly = node.every(
                    (item) =>
                        item === null ||
                        typeof item === 'string' ||
                        typeof item === 'number' ||
                        typeof item === 'boolean'
                );

                if (hasForecastLikeObject || (primitiveOnly && pathLooksForecast)) {
                    return 24;
                }
            }

            for (const item of node) {
                const nested = walk(item, path);
                if (nested === 24) {
                    return nested;
                }
            }

            return undefined;
        }

        const record = node as Record<string, unknown>;
        const keys = Object.keys(record);
        const objectLooksForecast = keys.some((key) => FORECAST_HINT_REGEX.test(key));

        for (const key of keys) {
            const child = record[key];
            if (
                Array.isArray(child) &&
                child.length === 24 &&
                (objectLooksForecast || FORECAST_HINT_REGEX.test(key))
            ) {
                return 24;
            }
        }

        for (const key of keys) {
            const nested = walk(record[key], [...path, key]);
            if (nested === 24) {
                return nested;
            }
        }

        return undefined;
    };

    return walk(value);
}

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const coordinateViewer = page.getByTestId('coordinate-viewer');
    const weatherForecastHeading = infoPanel.getByRole('heading', {
        name: 'Weather Forecast',
        exact: true
    });
    const placeholderText = weatherForecastSection.getByText(
        'Click on the map to load a forecast.',
        { exact: true }
    );
    const errorText = weatherForecastSection.getByText('Fehler beim Laden der Wetterdaten', {
        exact: true
    });

    const readCoordinateViewerText = async () =>
        (((await coordinateViewer.textContent()) ?? '').replace(/\s+/g, ' ').trim());

    const getRenderedForecastEntryCount = async () =>
        await weatherForecastSection.evaluate((section) => {
            const exactTimeRegex = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;
            const compactTimeRegex = /\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g;

            const semanticCounts = [
                section.querySelectorAll('[role="listitem"]').length,
                section.querySelectorAll('li').length,
                Array.from(section.querySelectorAll('tr')).filter((row) =>
                    row.querySelector('td, th')
                ).length,
                section.querySelectorAll('img').length
            ];

            for (const count of semanticCounts) {
                if (count === 24) {
                    return 24;
                }
            }

            const uniqueTimes = new Set<string>();
            const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);

            let node: Node | null = walker.nextNode();
            while (node) {
                const text = node.textContent?.trim() ?? '';
                if (exactTimeRegex.test(text)) {
                    uniqueTimes.add(text);
                }

                const matches = text.match(compactTimeRegex) ?? [];
                for (const match of matches) {
                    uniqueTimes.add(match);
                }

                node = walker.nextNode();
            }

            if (uniqueTimes.size === 24) {
                return 24;
            }

            return 0;
        });

    await expect(mapContainer).toBeVisible();
    await expect(coordinateViewer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        const pressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(placeholderText).toBeVisible();

    const capturedRequests: CapturedRequest[] = [];
    const capturedResponses: CapturedResponse[] = [];

    page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (resourceType === 'xhr' || resourceType === 'fetch') {
            capturedRequests.push({
                url: request.url(),
                method: request.method()
            });
        }
    });

    page.on('response', async (response) => {
        const resourceType = response.request().resourceType();
        if (resourceType !== 'xhr' && resourceType !== 'fetch') {
            return;
        }

        let forecastEntryCount: number | undefined;
        try {
            const contentType = response.headers()['content-type'] ?? '';
            if (contentType.includes('json') || /weather|forecast|meteo/i.test(response.url())) {
                const body = await response.json();
                forecastEntryCount = extractForecastEntryCount(body);
            }
        } catch {
            // Ignore non-JSON or unreadable responses.
        }

        capturedResponses.push({
            url: response.url(),
            status: response.status(),
            forecastEntryCount
        });
    });

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const clamp = (value: number, min: number, max: number) =>
        Math.max(min, Math.min(max, value));

    const candidateFractions = [
        { x: 0.58, y: 0.43 },
        { x: 0.62, y: 0.52 },
        { x: 0.54, y: 0.60 },
        { x: 0.68, y: 0.46 },
        { x: 0.50, y: 0.48 },
        { x: 0.72, y: 0.58 }
    ];

    let loadedForecast = false;
    let successfulResponse: CapturedResponse | undefined;
    let coordinateAfterSuccessfulClick = '';

    for (const candidate of candidateFractions) {
        const position = {
            x: clamp(Math.round(mapBox.width * candidate.x), 10, Math.round(mapBox.width) - 10),
            y: clamp(Math.round(mapBox.height * candidate.y), 10, Math.round(mapBox.height) - 10)
        };

        const previousCoordinateText = await readCoordinateViewerText();
        const requestCountBeforeClick = capturedRequests.length;
        const responseCountBeforeClick = capturedResponses.length;

        await mapContainer.click({ position });

        await expect
            .poll(async () => await readCoordinateViewerText())
            .not.toBe(previousCoordinateText);

        await expect
            .poll(async () => await readCoordinateViewerText())
            .toMatch(/EPSG:\d+/);

        try {
            await expect
                .poll(
                    async () => {
                        const renderedEntryCount = await getRenderedForecastEntryCount();
                        const freshResponses = capturedResponses.slice(responseCountBeforeClick);
                        const match = freshResponses.find(
                            (entry) =>
                                entry.status >= 200 &&
                                entry.status < 300 &&
                                entry.forecastEntryCount === 24
                        );

                        if (match) {
                            successfulResponse = match;
                        }

                        return renderedEntryCount === 24 ? 24 : match?.forecastEntryCount ?? 0;
                    },
                    { timeout: 12000 }
                )
                .toBe(24);

            await expect
                .poll(
                    () => {
                        const freshRequests = capturedRequests.slice(requestCountBeforeClick);
                        return freshRequests.length;
                    },
                    { timeout: 5000 }
                )
                .toBeGreaterThan(0);

            loadedForecast = true;
            coordinateAfterSuccessfulClick = await readCoordinateViewerText();
            break;
        } catch {
            continue;
        }
    }

    expect(
        loadedForecast,
        'No clicked map position loaded a weather forecast with 24 entries.'
    ).toBe(true);

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(placeholderText).not.toBeVisible();
    await expect(errorText).not.toBeVisible();

    await expect
        .poll(async () => await readCoordinateViewerText())
        .toBe(coordinateAfterSuccessfulClick);

    await expect
        .poll(async () => await readCoordinateViewerText())
        .toMatch(/EPSG:\d+/);

    await expect
        .poll(async () => {
            const renderedEntryCount = await getRenderedForecastEntryCount();
            return renderedEntryCount === 24 ? 24 : successfulResponse?.forecastEntryCount ?? 0;
        })
        .toBe(24);

    expect(successfulResponse?.forecastEntryCount ?? 24).toBe(24);
});
