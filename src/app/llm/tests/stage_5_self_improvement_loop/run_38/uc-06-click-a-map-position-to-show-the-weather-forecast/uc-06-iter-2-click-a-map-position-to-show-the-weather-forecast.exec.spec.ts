// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const weatherForecastHeading = page.getByRole('heading', { name: 'Weather Forecast', exact: true });

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    type ResponseSummary = {
        status: number;
        url: string;
        count?: number;
    };

    const normalizeText = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

    const extractForecastEntryCount = (value: unknown): number | undefined => {
        const visited = new Set<unknown>();

        const visit = (node: unknown): number | undefined => {
            if (node == null || typeof node !== 'object') {
                return undefined;
            }
            if (visited.has(node)) {
                return undefined;
            }
            visited.add(node);

            if (Array.isArray(node)) {
                const informativeItems = node.filter((item) => {
                    if (item == null) {
                        return false;
                    }
                    if (typeof item === 'object') {
                        return Object.keys(item as Record<string, unknown>).length > 0;
                    }
                    if (typeof item === 'string') {
                        return item.trim().length > 0;
                    }
                    return typeof item === 'number' || typeof item === 'boolean';
                }).length;

                if (node.length === 24 && informativeItems >= 20) {
                    return 24;
                }

                for (const item of node) {
                    const nested = visit(item);
                    if (nested !== undefined) {
                        return nested;
                    }
                }
            } else {
                for (const nestedValue of Object.values(node as Record<string, unknown>)) {
                    const nested = visit(nestedValue);
                    if (nested !== undefined) {
                        return nested;
                    }
                }
            }

            return undefined;
        };

        return visit(value);
    };

    const countRenderedForecastEntries = async (): Promise<number> => {
        return await weatherForecastSection.evaluate((section) => {
            const normalize = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();
            const text = normalize(section.textContent);

            const times = (text.match(/\b(?:[01]?\d|2[0-3]):\d{2}\b/g) ?? []).map((time) =>
                time.length === 4 ? `0${time}` : time
            );
            if (new Set(times).size === 24) {
                return 24;
            }

            const informativeChildrenCount = (element: Element): number =>
                Array.from(element.children).filter((child) => {
                    const childText = normalize(child.textContent);
                    return childText.length > 0 || child.querySelector('img,svg,canvas') !== null;
                }).length;

            const candidates = [section, ...Array.from(section.querySelectorAll('*'))];
            for (const element of candidates) {
                const childCount = element.children.length;
                const informativeCount = informativeChildrenCount(element);
                if (childCount === 24 && informativeCount >= 20) {
                    return 24;
                }
                if ((childCount === 25 || childCount === 26) && informativeCount >= 24) {
                    return 24;
                }
            }

            return 0;
        });
    };

    const recordedResponses: Response[] = [];
    const analyzedResponses = new WeakMap<Response, ResponseSummary>();

    page.on('response', (response) => {
        if (['fetch', 'xhr'].includes(response.request().resourceType())) {
            recordedResponses.push(response);
        }
    });

    const analyzeResponse = async (response: Response): Promise<ResponseSummary> => {
        const cached = analyzedResponses.get(response);
        if (cached) {
            return cached;
        }

        const summary: ResponseSummary = {
            status: response.status(),
            url: response.url()
        };

        try {
            const bodyText = await response.text();
            if (bodyText.trim().length > 0) {
                try {
                    const parsed = JSON.parse(bodyText);
                    summary.count = extractForecastEntryCount(parsed);
                } catch {
                    // Ignore non-JSON bodies.
                }
            }
        } catch {
            // Ignore unreadable bodies.
        }

        analyzedResponses.set(response, summary);
        return summary;
    };

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const layerSwitcherBox = await layerSwitcher.boundingBox();
    const infoPanelBox = await infoPanel.boundingBox();

    const safeLeft = Math.max(
        20,
        layerSwitcherBox ? Math.round(layerSwitcherBox.x + layerSwitcherBox.width - mapBox.x + 20) : Math.round(mapBox.width * 0.25)
    );
    const safeRight = Math.min(
        Math.round(mapBox.width - 20),
        infoPanelBox ? Math.round(infoPanelBox.x - mapBox.x - 20) : Math.round(mapBox.width * 0.75)
    );

    const centerX = Math.round((safeLeft + safeRight) / 2);
    const midY = Math.round(mapBox.height * 0.52);
    const lowerY = Math.round(mapBox.height * 0.60);
    const upperY = Math.round(mapBox.height * 0.44);

    const clickPositions = [
        { x: Math.max(safeLeft + 40, centerX - 60), y: midY },
        { x: centerX, y: midY },
        { x: Math.min(safeRight - 40, centerX + 60), y: upperY },
        { x: Math.max(safeLeft + 40, centerX - 100), y: lowerY }
    ];

    let successfulForecast: ResponseSummary | undefined;

    for (const position of clickPositions) {
        const responseStartIndex = recordedResponses.length;

        await mapContainer.click({ position });
        await expect.poll(() => getHighlightedCoordinate(page), { timeout: 5000 }).not.toBeUndefined();

        try {
            await expect
                .poll(
                    async () => {
                        for (let index = responseStartIndex; index < recordedResponses.length; index++) {
                            const summary = await analyzeResponse(recordedResponses[index]);
                            if (summary.status >= 200 && summary.status < 300 && summary.count === 24) {
                                successfulForecast = summary;
                                return 24;
                            }
                        }
                        return 0;
                    },
                    { timeout: 6000 }
                )
                .toBe(24);
            break;
        } catch {
            // Try another map position.
        }
    }

    if (!successfulForecast) {
        const latestSectionText = normalizeText(await weatherForecastSection.textContent());
        const recentResponses = await Promise.all(
            recordedResponses.slice(-6).map(async (response) => {
                const summary = await analyzeResponse(response);
                return `${summary.status} ${summary.url}${summary.count !== undefined ? ` (count=${summary.count})` : ''}`;
            })
        );

        throw new Error(
            `No successful weather forecast response with 24 entries was received after clicking the map. ` +
                `Latest section text: "${latestSectionText}". ` +
                `Recent fetch/xhr responses: ${recentResponses.join(' | ')}`
        );
    }

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();

    await expect
        .poll(async () => normalizeText(await weatherForecastSection.textContent()), { timeout: 10000 })
        .not.toMatch(/Click on the map to load a forecast\.|Fehler beim Laden der Wetterdaten/);

    await expect.poll(async () => countRenderedForecastEntries(), { timeout: 10000 }).toBe(24);
    await expect.poll(() => Promise.resolve(successfulForecast?.count)).toBe(24);
});
