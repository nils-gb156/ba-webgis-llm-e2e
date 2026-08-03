// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const coordinateViewer = page.getByTestId('coordinate-viewer');
    const initialExtentButton = page.getByTestId('initial-extent-button');
    const weatherForecastHeading = page.getByRole('heading', { name: 'Weather Forecast', exact: true });

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

    await expect(initialExtentButton).toBeVisible();
    await initialExtentButton.click();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    type LonLat = { lon: number; lat: number };
    type Sample = { position: { x: number; y: number }; lon: number; lat: number };
    type ForecastState = {
        text: string;
        hasPlaceholder: boolean;
        hasError: boolean;
        entryCount: number;
    };

    const parseCoordinateText = (text: string | null): LonLat | undefined => {
        if (!text) return undefined;
        const match = text.match(
            /(\d+)°(\d+)(?:'|′)([\d.]+)(?:"|″)\(([EW])\)\s+(\d+)°(\d+)(?:'|′)([\d.]+)(?:"|″)\(([NS])\)/
        );
        if (!match) return undefined;

        const [, lonDeg, lonMin, lonSec, lonHemisphere, latDeg, latMin, latSec, latHemisphere] = match;

        const toDecimal = (deg: string, min: string, sec: string, hemisphere: string): number => {
            const value = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
            return hemisphere === 'W' || hemisphere === 'S' ? -value : value;
        };

        return {
            lon: toDecimal(lonDeg, lonMin, lonSec, lonHemisphere),
            lat: toDecimal(latDeg, latMin, latSec, latHemisphere)
        };
    };

    const distanceSquared = (a: LonLat, b: LonLat): number =>
        (a.lon - b.lon) ** 2 + (a.lat - b.lat) ** 2;

    let lastCoordinateText: string | undefined;

    const samplePoint = async (
        position: { x: number; y: number },
        requireChangedText: boolean
    ): Promise<Sample | undefined> => {
        try {
            await mapContainer.hover({ position });

            let currentText = '';
            let currentCoords: LonLat | undefined;

            await expect
                .poll(async () => {
                    currentText = ((await coordinateViewer.textContent()) ?? '').trim();
                    currentCoords = parseCoordinateText(currentText);

                    if (!currentCoords) {
                        return false;
                    }

                    if (!requireChangedText) {
                        return true;
                    }

                    return currentText !== lastCoordinateText;
                }, { timeout: 3000 })
                .toBe(true);

            if (!currentCoords) {
                return undefined;
            }

            lastCoordinateText = currentText;

            return {
                position,
                lon: currentCoords.lon,
                lat: currentCoords.lat
            };
        } catch {
            return undefined;
        }
    };

    const clampPosition = (position: { x: number; y: number }): { x: number; y: number } => ({
        x: Math.max(5, Math.min(Math.round(position.x), Math.round(mapBox.width) - 5)),
        y: Math.max(5, Math.min(Math.round(position.y), Math.round(mapBox.height) - 5))
    });

    const readForecastState = async (): Promise<ForecastState> =>
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

    const coarseXPercents = [0.28, 0.34, 0.40, 0.46, 0.52, 0.58, 0.64, 0.70];
    const coarseYPercents = [0.18, 0.26, 0.34, 0.42, 0.50, 0.58, 0.66, 0.74];
    const coarseSamples: Sample[] = [];

    for (const yPercent of coarseYPercents) {
        for (const xPercent of coarseXPercents) {
            const sample = await samplePoint(
                clampPosition({
                    x: mapBox.width * xPercent,
                    y: mapBox.height * yPercent
                }),
                coarseSamples.length > 0
            );

            if (sample) {
                coarseSamples.push(sample);
            }
        }
    }

    expect(coarseSamples.length).toBeGreaterThan(0);

    const targetLocations = [
        { name: 'Berlin', lon: 13.405, lat: 52.52 },
        { name: 'Hamburg', lon: 9.9937, lat: 53.5511 },
        { name: 'Munich', lon: 11.582, lat: 48.1351 }
    ];

    let successfulForecast: ForecastState | undefined;
    let lastForecastState = await readForecastState();

    for (const target of targetLocations) {
        const coarseBest = coarseSamples.reduce((best, current) =>
            distanceSquared(current, target) < distanceSquared(best, target) ? current : best
        );

        const refinedSamples: Sample[] = [coarseBest];
        const xOffsets = [-40, -20, 0, 20, 40];
        const yOffsets = [-40, -20, 0, 20, 40];

        for (const yOffset of yOffsets) {
            for (const xOffset of xOffsets) {
                if (xOffset === 0 && yOffset === 0) {
                    continue;
                }

                const refinedSample = await samplePoint(
                    clampPosition({
                        x: coarseBest.position.x + xOffset,
                        y: coarseBest.position.y + yOffset
                    }),
                    true
                );

                if (refinedSample) {
                    refinedSamples.push(refinedSample);
                }
            }
        }

        const bestClickPoint = refinedSamples.reduce((best, current) =>
            distanceSquared(current, target) < distanceSquared(best, target) ? current : best
        );

        const previousHighlight = await getHighlightedCoordinate(page);

        await mapContainer.click({ position: bestClickPoint.position });

        await expect.poll(() => getHighlightedCoordinate(page), { timeout: 10000 }).not.toBeUndefined();

        if (previousHighlight !== undefined) {
            await expect
                .poll(async () => JSON.stringify(await getHighlightedCoordinate(page)), { timeout: 10000 })
                .not.toBe(JSON.stringify(previousHighlight));
        }

        let status: 'loading' | 'error' | 'success' | 'timeout' = 'loading';

        try {
            await expect
                .poll(async () => {
                    lastForecastState = await readForecastState();

                    if (lastForecastState.hasError) {
                        status = 'error';
                        return status;
                    }

                    if (!lastForecastState.hasPlaceholder && lastForecastState.entryCount === 24) {
                        status = 'success';
                        return status;
                    }

                    status = 'loading';
                    return status;
                }, { timeout: 20000 })
                .toMatch(/success|error/);
        } catch {
            status = 'timeout';
        }

        if (status === 'success') {
            successfulForecast = lastForecastState;
            break;
        }
    }

    if (!successfulForecast) {
        throw new Error(
            `Weather forecast did not load successfully for any tested map position. Last state: ${JSON.stringify(
                lastForecastState
            )}`
        );
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    expect(successfulForecast.hasPlaceholder).toBe(false);
    expect(successfulForecast.hasError).toBe(false);
    expect(successfulForecast.entryCount).toBe(24);
});
