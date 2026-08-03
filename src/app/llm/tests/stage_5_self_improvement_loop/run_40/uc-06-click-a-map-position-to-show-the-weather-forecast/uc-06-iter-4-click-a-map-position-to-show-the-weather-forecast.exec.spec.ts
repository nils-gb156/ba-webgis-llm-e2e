// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    test.setTimeout(180000);

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
    const placeholderText = weatherForecastSection.getByText(
        'Click on the map to load a forecast.',
        { exact: true }
    );
    const errorText = weatherForecastSection.getByText('Fehler beim Laden der Wetterdaten', {
        exact: true
    });

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

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

    const xhrOrFetchResponses: Array<{ url: string; status: number }> = [];
    page.on('response', (response) => {
        const resourceType = response.request().resourceType();
        if (resourceType === 'xhr' || resourceType === 'fetch') {
            xhrOrFetchResponses.push({
                url: response.url(),
                status: response.status()
            });
        }
    });

    const readForecastState = async (): Promise<{
        text: string;
        hasPlaceholder: boolean;
        hasError: boolean;
        entryCount: number;
    }> => {
        return await weatherForecastSection.evaluate((section) => {
            const isVisible = (element: Element): boolean => {
                const htmlElement = element as HTMLElement;
                const style = window.getComputedStyle(htmlElement);
                return (
                    !htmlElement.hidden &&
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    htmlElement.getClientRects().length > 0
                );
            };

            const root = section as HTMLElement;
            const text = root.innerText ?? '';

            const selectorCounts = [
                'li',
                '[role="listitem"]',
                'article',
                'time',
                'tbody > tr',
                '[role="row"]',
                'img',
                'svg'
            ].map(
                (selector) => Array.from(root.querySelectorAll(selector)).filter(isVisible).length
            );

            const visibleElements = [root, ...Array.from(root.querySelectorAll('*'))].filter(
                isVisible
            );

            const childCounts = visibleElements
                .map((node) => Array.from(node.children).filter(isVisible).length)
                .filter((count) => count > 0);

            const colonHourMatches = new Set(text.match(/\b(?:[01]\d|2[0-3]):00\b/g) ?? []);
            const uhrHourMatches = new Set(
                (text.match(/\b(?:[01]?\d|2[0-3])\s*Uhr\b/gi) ?? []).map((value) =>
                    value.toLowerCase().replace(/\s+/g, ' ').trim()
                )
            );
            const hHourMatches = new Set(
                (text.match(/\b(?:[01]?\d|2[0-3])\s*h\b/gi) ?? []).map((value) =>
                    value.toLowerCase().replace(/\s+/g, ' ').trim()
                )
            );

            const candidateCounts = [
                ...selectorCounts,
                ...childCounts,
                colonHourMatches.size,
                uhrHourMatches.size,
                hHourMatches.size
            ];

            return {
                text,
                hasPlaceholder: /Click on the map to load a forecast\./i.test(text),
                hasError: /Fehler beim Laden der Wetterdaten/i.test(text),
                entryCount: candidateCounts.includes(24) ? 24 : 0
            };
        });
    };

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const clamp = (value: number, min: number, max: number) =>
        Math.max(min, Math.min(max, value));

    const candidateFractions = [
        { name: 'Vienna cluster west', x: 0.753, y: 0.788 },
        { name: 'Vienna cluster south', x: 0.780, y: 0.835 },
        { name: 'Prague station', x: 0.668, y: 0.646 },
        { name: 'Czechia east station', x: 0.734, y: 0.617 },
        { name: 'Berlin station', x: 0.622, y: 0.295 },
        { name: 'Leipzig station', x: 0.584, y: 0.523 },
        { name: 'Hanover station', x: 0.460, y: 0.309 },
        { name: 'Hamburg station', x: 0.449, y: 0.146 },
        { name: 'Cologne station', x: 0.346, y: 0.559 },
        { name: 'Netherlands cluster station', x: 0.281, y: 0.365 },
        { name: 'Southern Germany station', x: 0.557, y: 0.827 },
        { name: 'Austria north-east cluster', x: 0.796, y: 0.790 }
    ];

    let successfulClick:
        | {
              name: string;
              x: number;
              y: number;
          }
        | undefined;

    for (const candidate of candidateFractions) {
        const position = {
            x: clamp(Math.round(mapBox.width * candidate.x), 5, Math.round(mapBox.width) - 5),
            y: clamp(Math.round(mapBox.height * candidate.y), 5, Math.round(mapBox.height) - 5)
        };

        const previousHighlight = await getHighlightedCoordinate(page);
        const previousForecastState = await readForecastState();
        const responseCountBeforeClick = xhrOrFetchResponses.length;

        await mapContainer.click({ position });

        try {
            await expect
                .poll(
                    async () => {
                        const currentHighlight = await getHighlightedCoordinate(page);
                        if (!Array.isArray(currentHighlight) || currentHighlight.length !== 2) {
                            return false;
                        }

                        if (!previousHighlight) {
                            return true;
                        }

                        return (
                            currentHighlight[0] !== previousHighlight[0] ||
                            currentHighlight[1] !== previousHighlight[1]
                        );
                    },
                    { timeout: 5000 }
                )
                .toBe(true);
        } catch {
            continue;
        }

        try {
            await expect
                .poll(() => xhrOrFetchResponses.length, { timeout: 7000 })
                .toBeGreaterThan(responseCountBeforeClick);
        } catch {
            continue;
        }

        const newResponses = xhrOrFetchResponses.slice(responseCountBeforeClick);
        const latestResponseStatus = newResponses[newResponses.length - 1]?.status;

        let stateAfterClick:
            | {
                  text: string;
                  hasPlaceholder: boolean;
                  hasError: boolean;
                  entryCount: number;
              }
            | undefined;

        try {
            await expect
                .poll(
                    async () => {
                        const currentState = await readForecastState();
                        stateAfterClick = currentState;

                        if (currentState.entryCount === 24) {
                            return 'loaded';
                        }

                        if (
                            currentState.hasError &&
                            (latestResponseStatus !== undefined
                                ? latestResponseStatus >= 400 ||
                                  currentState.text !== previousForecastState.text
                                : currentState.text !== previousForecastState.text)
                        ) {
                            return 'error';
                        }

                        return 'pending';
                    },
                    { timeout: 10000 }
                )
                .toMatch(/^(loaded|error)$/);
        } catch {
            continue;
        }

        if (stateAfterClick?.entryCount === 24) {
            successfulClick = {
                name: candidate.name,
                x: position.x,
                y: position.y
            };
            break;
        }
    }

    expect(
        successfulClick,
        'No tested map position produced a visible 24-entry weather forecast.'
    ).toBeDefined();

    await expect
        .poll(async () => {
            const highlight = await getHighlightedCoordinate(page);
            return Array.isArray(highlight) && highlight.length === 2;
        })
        .toBe(true);

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(placeholderText).not.toBeVisible();
    await expect(errorText).not.toBeVisible();

    await expect
        .poll(async () => {
            const state = await readForecastState();
            return state.entryCount;
        })
        .toBe(24);
});
