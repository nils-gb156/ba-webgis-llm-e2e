// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    test.setTimeout(240000);

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

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
    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(placeholderText).toBeVisible();

    const readForecastState = async (): Promise<{
        status: 'placeholder' | 'error' | 'loaded' | 'unknown';
        count: number;
        fingerprint: string;
    }> => {
        return await weatherForecastSection.evaluate((section) => {
            const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim();
            const text = normalize(section.textContent ?? '');
            const fingerprint = `${text}|${section.querySelectorAll('*').length}`;

            const candidateCounts: number[] = [];
            const addCandidate = (value: number): void => {
                if (Number.isInteger(value) && value > 0 && value <= 30) {
                    candidateCounts.push(value);
                }
            };

            addCandidate(section.querySelectorAll('[role="listitem"]').length);
            addCandidate(section.querySelectorAll('li').length);
            addCandidate(section.querySelectorAll('article').length);
            addCandidate(section.querySelectorAll('time').length);
            addCandidate(section.querySelectorAll('[datetime]').length);
            addCandidate(
                Array.from(section.querySelectorAll('tr')).filter((row) => row.querySelector('td, th'))
                    .length
            );

            for (const element of Array.from(section.querySelectorAll<HTMLElement>('*'))) {
                const children = Array.from(element.children) as HTMLElement[];
                addCandidate(children.length);

                const signatureCounts = new Map<string, number>();
                for (const child of children) {
                    const signature = [
                        child.tagName,
                        child.getAttribute('role') ?? '',
                        child.getAttribute('aria-label') ?? '',
                        child.className ?? ''
                    ].join('|');
                    signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
                }

                for (const count of signatureCounts.values()) {
                    addCandidate(count);
                }
            }

            const uniqueTimes = new Set<string>();
            const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
            let node = walker.nextNode();

            while (node) {
                const value = normalize(node.textContent ?? '');

                if (value) {
                    for (const match of value.matchAll(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g)) {
                        uniqueTimes.add(`${match[1].padStart(2, '0')}:${match[2]}`);
                    }
                    for (const match of value.matchAll(/\b([01]?\d|2[0-3])\s*Uhr\b/gi)) {
                        uniqueTimes.add(`${match[1].padStart(2, '0')}:00`);
                    }
                }

                node = walker.nextNode();
            }

            addCandidate(uniqueTimes.size);

            const has24Entries = candidateCounts.includes(24) || uniqueTimes.size === 24;
            const count = has24Entries ? 24 : Math.max(0, ...candidateCounts);
            const hasPlaceholder = text.includes('Click on the map to load a forecast.');
            const hasError = text.includes('Fehler beim Laden der Wetterdaten');

            const status: 'placeholder' | 'error' | 'loaded' | 'unknown' = has24Entries
                ? 'loaded'
                : hasError
                  ? 'error'
                  : hasPlaceholder || !text
                    ? 'placeholder'
                    : 'unknown';

            return { status, count, fingerprint };
        });
    };

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const clamp = (value: number, min: number, max: number): number =>
        Math.max(min, Math.min(max, value));

    const candidatePositions = [
        { x: 0.60, y: 0.24 },
        { x: 0.69, y: 0.42 },
        { x: 0.74, y: 0.63 },
        { x: 0.81, y: 0.72 },
        { x: 0.86, y: 0.79 },
        { x: 0.55, y: 0.57 },
        { x: 0.63, y: 0.31 },
        { x: 0.46, y: 0.69 },
        { x: 0.37, y: 0.33 }
    ];

    let forecastLoaded = false;
    let highlightBeforeSuccessfulClick: string | undefined;

    for (const candidate of candidatePositions) {
        const previousHighlight = JSON.stringify((await getHighlightedCoordinate(page)) ?? null);
        const previousForecastFingerprint = (await readForecastState()).fingerprint;

        const position = {
            x: clamp(Math.round(mapBox.width * candidate.x), 24, Math.round(mapBox.width) - 24),
            y: clamp(Math.round(mapBox.height * candidate.y), 24, Math.round(mapBox.height) - 24)
        };

        try {
            await mapContainer.click({ position });

            await expect
                .poll(
                    async () => JSON.stringify((await getHighlightedCoordinate(page)) ?? null),
                    { timeout: 10000 }
                )
                .not.toBe(previousHighlight);

            await expect.poll(() => getHighlightedCoordinate(page), { timeout: 10000 }).not.toBeUndefined();

            await expect
                .poll(async () => (await readForecastState()).count, { timeout: 25000 })
                .toBe(24);

            await expect
                .poll(async () => (await readForecastState()).fingerprint, { timeout: 5000 })
                .not.toBe(previousForecastFingerprint);

            forecastLoaded = true;
            highlightBeforeSuccessfulClick = previousHighlight;
            break;
        } catch {
            // Try another map position.
        }
    }

    expect(
        forecastLoaded,
        'Clicking the map did not load a weather forecast with 24 entries.'
    ).toBe(true);

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(placeholderText).toBeHidden();
    await expect(errorText).toBeHidden();

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

    if (highlightBeforeSuccessfulClick !== undefined) {
        expect(JSON.stringify((await getHighlightedCoordinate(page)) ?? null)).not.toBe(
            highlightBeforeSuccessfulClick
        );
    }

    await expect
        .poll(async () => {
            const state = await readForecastState();
            return state.status;
        })
        .toBe('loaded');

    await expect
        .poll(async () => {
            const state = await readForecastState();
            return state.count;
        })
        .toBe(24);
});
