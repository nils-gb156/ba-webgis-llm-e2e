// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const normalizeText = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();

    const extractForecastEntryCount = (value: unknown): number | undefined => {
        const visited = new Set<unknown>();

        const visit = (node: unknown): number | undefined => {
            if (node == null) {
                return undefined;
            }
            if (typeof node !== 'object') {
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

                return undefined;
            }

            for (const nestedValue of Object.values(node as Record<string, unknown>)) {
                const nested = visit(nestedValue);
                if (nested !== undefined) {
                    return nested;
                }
            }

            return undefined;
        };

        return visit(value);
    };

    const recordedRequests: any[] = [];
    const recordedResponses: any[] = [];
    const analyzedResponses = new WeakMap<object, { status: number; url: string; count?: number }>();

    page.on('request', (request) => {
        if (['fetch', 'xhr'].includes(request.resourceType())) {
            recordedRequests.push(request);
        }
    });

    page.on('response', (response) => {
        if (['fetch', 'xhr'].includes(response.request().resourceType())) {
            recordedResponses.push(response);
        }
    });

    const analyzeResponse = async (response: any) => {
        const cached = analyzedResponses.get(response);
        if (cached) {
            return cached;
        }

        const summary: { status: number; url: string; count?: number } = {
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
                    // Ignore non-JSON responses.
                }
            }
        } catch {
            // Ignore unreadable response bodies.
        }

        analyzedResponses.set(response, summary);
        return summary;
    };

    const clickPositions = [
        { xFactor: 0.63, yFactor: 0.46 },
        { xFactor: 0.72, yFactor: 0.56 },
        { xFactor: 0.58, yFactor: 0.60 },
        { xFactor: 0.80, yFactor: 0.42 }
    ];

    let successfulForecast:
        | {
              count: number;
              url: string;
              status: number;
              requestDelta: number;
          }
        | undefined;

    for (const position of clickPositions) {
        const requestStartIndex = recordedRequests.length;
        const responseStartIndex = recordedResponses.length;
        const previousHighlight = await getHighlightedCoordinate(page);
        const previousHighlightKey = previousHighlight?.map((value) => Math.round(value)).join(',');

        await mapContainer.click({
            position: {
                x: Math.round(mapBox.width * position.xFactor),
                y: Math.round(mapBox.height * position.yFactor)
            }
        });

        if (previousHighlightKey) {
            await expect
                .poll(async () => {
                    const highlighted = await getHighlightedCoordinate(page);
                    return highlighted?.map((value) => Math.round(value)).join(',');
                })
                .not.toBe(previousHighlightKey);
        } else {
            await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
        }

        let matchedResponse:
            | {
                  count: number;
                  url: string;
                  status: number;
              }
            | undefined;

        try {
            await expect
                .poll(
                    async () => {
                        for (let index = responseStartIndex; index < recordedResponses.length; index++) {
                            const summary = await analyzeResponse(recordedResponses[index]);
                            if (summary.status >= 200 && summary.status < 300 && summary.count === 24) {
                                matchedResponse = {
                                    count: 24,
                                    url: summary.url,
                                    status: summary.status
                                };
                                return 24;
                            }
                        }
                        return 0;
                    },
                    { timeout: 15000 }
                )
                .toBe(24);
        } catch {
            continue;
        }

        successfulForecast = {
            count: matchedResponse!.count,
            url: matchedResponse!.url,
            status: matchedResponse!.status,
            requestDelta: recordedRequests.length - requestStartIndex
        };
        break;
    }

    if (!successfulForecast) {
        const latestSectionText = normalizeText(await weatherForecastSection.textContent());
        const recentResponses = await Promise.all(
            recordedResponses.slice(-5).map(async (response) => {
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

    await expect.poll(() => Promise.resolve(successfulForecast?.requestDelta ?? 0)).toBeGreaterThan(0);
    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect(weatherForecastSection).toBeVisible();

    await expect
        .poll(async () => normalizeText(await weatherForecastSection.textContent()), { timeout: 15000 })
        .not.toMatch(/Click on the map to load a forecast\.|Fehler beim Laden der Wetterdaten/);

    await expect
        .poll(async () => normalizeText(await weatherForecastSection.textContent()).length, { timeout: 15000 })
        .toBeGreaterThan(30);

    await expect
        .poll(
            () =>
                weatherForecastSection.evaluate((section) => {
                    const normalize = (text: string | null | undefined) =>
                        (text ?? '').replace(/\s+/g, ' ').trim();

                    const fullText = normalize(section.textContent);
                    const timeMatches = fullText.match(/\b(?:[01]?\d|2[0-3]):\d{2}\b/g) ?? [];
                    const uniqueTimes = new Set(timeMatches).size;

                    if (uniqueTimes === 24) {
                        return 24;
                    }

                    const elements = [section, ...Array.from(section.querySelectorAll('*'))];

                    const hasInformativeContent = (element: Element) => {
                        const text = normalize(element.textContent);
                        return text.length > 0 || element.querySelector('img,svg,canvas') !== null;
                    };

                    for (const element of elements) {
                        const children = Array.from(element.children);

                        if (children.length === 24) {
                            const informativeChildren = children.filter(hasInformativeContent).length;
                            if (informativeChildren >= 20) {
                                return 24;
                            }
                        }

                        if (children.length === 25 || children.length === 26) {
                            const informativeChildren = children.filter(hasInformativeContent).length;
                            if (informativeChildren >= 24) {
                                return 24;
                            }
                        }
                    }

                    return 0;
                }),
            { timeout: 15000 }
        )
        .toBe(24);

    await expect.poll(() => Promise.resolve(successfulForecast?.count)).toBe(24);
});
