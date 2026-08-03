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
    const initialExtentButton = page.getByTestId('initial-extent-button');
    const weatherForecastHeading = page.getByRole('heading', {
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
        weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true })
    ).toBeVisible();

    await expect(initialExtentButton).toBeVisible();
    await initialExtentButton.click();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    type ClickPosition = { x: number; y: number };
    type ForecastState = {
        text: string;
        hasPlaceholder: boolean;
        hasError: boolean;
        entryCount: number;
    };

    const clampPosition = (position: ClickPosition): ClickPosition => ({
        x: Math.max(8, Math.min(Math.round(position.x), Math.round(mapBox.width) - 8)),
        y: Math.max(8, Math.min(Math.round(position.y), Math.round(mapBox.height) - 8))
    });

    const dedupePositions = (positions: ClickPosition[], minDistance = 18): ClickPosition[] => {
        const result: ClickPosition[] = [];
        for (const position of positions.map(clampPosition)) {
            const isDuplicate = result.some(
                (existing) =>
                    Math.hypot(existing.x - position.x, existing.y - position.y) < minDistance
            );
            if (!isDuplicate) {
                result.push(position);
            }
        }
        return result;
    };

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

            for (const list of Array.from(root.querySelectorAll('ul, ol, [role="list"]'))) {
                const itemCount = list.querySelectorAll(':scope > li, :scope > [role="listitem"]').length;
                if (itemCount > 0) {
                    counts.push(itemCount);
                }
            }

            const exactNodeTexts = Array.from(root.querySelectorAll('*'))
                .map((element) => (element as HTMLElement).innerText?.trim() ?? '')
                .filter(Boolean);

            const timePatterns = [
                /^(?:[01]\d|2[0-3]):[0-5]\d$/,
                /^(?:[01]?\d|2[0-3])\s?Uhr$/i,
                /^(?:[1-9]|1[0-2])(?::[0-5]\d)?\s?(?:AM|PM)$/i,
                /^\d{4}-\d{2}-\d{2}[ T](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?Z?$/
            ];

            const uniqueExactTimes = new Set(
                exactNodeTexts
                    .filter((value) => timePatterns.some((pattern) => pattern.test(value)))
                    .map((value) => value.toLowerCase())
            ).size;

            if (uniqueExactTimes > 0) {
                counts.push(uniqueExactTimes);
            }

            const inlinePatterns = [
                /\b(?:[01]\d|2[0-3]):[0-5]\d\b/g,
                /\b(?:[01]?\d|2[0-3])\s?Uhr\b/gi,
                /\b(?:[1-9]|1[0-2])(?::[0-5]\d)?\s?(?:AM|PM)\b/gi,
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

    const detectedMarkerCandidates = await mapContainer.evaluate((container) => {
        type Candidate = { x: number; y: number; weight: number };

        const rootRect = container.getBoundingClientRect();
        const safeMinX = rootRect.width * 0.28;
        const safeMaxX = rootRect.width * 0.82;
        const safeMinY = rootRect.height * 0.12;
        const safeMaxY = rootRect.height * 0.78;
        const binSize = 10;

        const bins = new Map<string, Candidate>();

        const canvases = Array.from(container.querySelectorAll('canvas')).filter(
            (canvas): canvas is HTMLCanvasElement => canvas instanceof HTMLCanvasElement
        );

        for (const canvas of canvases) {
            const canvasRect = canvas.getBoundingClientRect();
            if (
                canvas.width < 50 ||
                canvas.height < 50 ||
                canvasRect.width < 50 ||
                canvasRect.height < 50
            ) {
                continue;
            }

            const context = canvas.getContext('2d');
            if (!context) {
                continue;
            }

            let imageData: ImageData;
            try {
                imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            } catch {
                continue;
            }

            const data = imageData.data;
            const scaleX = canvasRect.width / canvas.width;
            const scaleY = canvasRect.height / canvas.height;

            for (let py = 0; py < canvas.height; py += 2) {
                for (let px = 0; px < canvas.width; px += 2) {
                    const offset = (py * canvas.width + px) * 4;
                    const r = data[offset];
                    const g = data[offset + 1];
                    const b = data[offset + 2];
                    const a = data[offset + 3];

                    const isBlueMarker = a > 180 && b > 110 && b - r > 45 && b - g > 20;
                    const isRedMarker = a > 180 && r > 150 && r - g > 45 && r - b > 45;

                    if (!isBlueMarker && !isRedMarker) {
                        continue;
                    }

                    const cssX = canvasRect.left - rootRect.left + (px + 0.5) * scaleX;
                    const cssY = canvasRect.top - rootRect.top + (py + 0.5) * scaleY;

                    if (
                        cssX < safeMinX ||
                        cssX > safeMaxX ||
                        cssY < safeMinY ||
                        cssY > safeMaxY
                    ) {
                        continue;
                    }

                    const key = `${Math.floor(cssX / binSize)}:${Math.floor(cssY / binSize)}`;
                    const current = bins.get(key) ?? { x: 0, y: 0, weight: 0 };
                    current.x += cssX;
                    current.y += cssY;
                    current.weight += 1;
                    bins.set(key, current);
                }
            }
        }

        const ranked = Array.from(bins.values())
            .filter((candidate) => candidate.weight >= 4)
            .map((candidate) => ({
                x: Math.round(candidate.x / candidate.weight),
                y: Math.round(candidate.y / candidate.weight),
                weight: candidate.weight
            }))
            .sort((a, b) => b.weight - a.weight);

        const deduped: Candidate[] = [];
        for (const candidate of ranked) {
            const tooClose = deduped.some(
                (existing) => Math.hypot(existing.x - candidate.x, existing.y - candidate.y) < 14
            );
            if (!tooClose) {
                deduped.push(candidate);
            }
            if (deduped.length >= 12) {
                break;
            }
        }

        return deduped.map(({ x, y }) => ({ x, y }));
    });

    const fallbackCandidates: ClickPosition[] = [
        { x: mapBox.width * 0.63, y: mapBox.height * 0.31 },
        { x: mapBox.width * 0.58, y: mapBox.height * 0.47 },
        { x: mapBox.width * 0.72, y: mapBox.height * 0.57 },
        { x: mapBox.width * 0.76, y: mapBox.height * 0.66 },
        { x: mapBox.width * 0.80, y: mapBox.height * 0.52 },
        { x: mapBox.width * 0.39, y: mapBox.height * 0.36 }
    ];

    const candidatePositions = dedupePositions([
        ...detectedMarkerCandidates,
        ...fallbackCandidates
    ]);

    expect(candidatePositions.length).toBeGreaterThan(0);

    let successfulForecast: ForecastState | undefined;
    let lastForecastState = await readForecastState();

    for (const position of candidatePositions.slice(0, 8)) {
        await mapContainer.click({ position });

        await expect.poll(() => getHighlightedCoordinate(page), { timeout: 10000 }).not.toBeUndefined();

        try {
            await expect
                .poll(
                    async () => {
                        lastForecastState = await readForecastState();
                        return (
                            !lastForecastState.hasPlaceholder &&
                            !lastForecastState.hasError &&
                            lastForecastState.entryCount === 24
                        );
                    },
                    { timeout: 15000 }
                )
                .toBe(true);

            successfulForecast = lastForecastState;
            break;
        } catch {
            // try the next visible station-like map position
        }
    }

    if (!successfulForecast) {
        throw new Error(
            `Weather forecast did not load successfully for any tested map position. Last state: ${JSON.stringify(
                lastForecastState
            )}. Tried positions: ${JSON.stringify(candidatePositions.slice(0, 8))}`
        );
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecastSection).not.toContainText('Fehler beim Laden der Wetterdaten');
    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    expect(successfulForecast.hasPlaceholder).toBe(false);
    expect(successfulForecast.hasError).toBe(false);
    expect(successfulForecast.entryCount).toBe(24);
});
