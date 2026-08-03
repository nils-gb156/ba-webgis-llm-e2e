// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getHighlightedCoordinate,
    getMapCenter,
    getMapZoomLevel
} from '../../../../map-model-helpers';

async function getRenderedForecastEntryCount(sectionLocator: any): Promise<number> {
    return await sectionLocator.evaluate((section: Element) => {
        const sectionText = (section.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (!sectionText || sectionText.includes('Click on the map to load a forecast.')) {
            return 0;
        }

        const semanticCounts = [
            section.querySelectorAll('[role="listitem"]').length,
            section.querySelectorAll('li').length,
            Array.from(section.querySelectorAll('tr')).filter((row) =>
                row.querySelector('td, th')
            ).length,
            section.querySelectorAll('article').length,
            section.querySelectorAll('img').length
        ];

        if (semanticCounts.includes(24)) {
            return 24;
        }

        const exactTimeRegex = /^(?:[01]?\d|2[0-3]):[0-5]\d$/;
        const inlineTimeRegex = /\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g;
        const hasAnyTimeRegex = /\b(?:[01]?\d|2[0-3]):[0-5]\d\b/;

        const uniqueTimes = new Set<string>();
        const exactTimeElements = Array.from(section.querySelectorAll('*'))
            .map((element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim())
            .filter((text) => exactTimeRegex.test(text));

        for (const time of exactTimeElements) {
            uniqueTimes.add(time);
        }

        const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
            const matches = ((node.textContent ?? '').match(inlineTimeRegex) ?? []).map((match) =>
                match.trim()
            );
            for (const match of matches) {
                uniqueTimes.add(match);
            }
            node = walker.nextNode();
        }

        if (uniqueTimes.size === 24) {
            return 24;
        }

        const repeatedContainerHas24Children = Array.from(section.querySelectorAll('*')).some(
            (element) => {
                const children = Array.from(element.children);
                if (children.length !== 24) {
                    return false;
                }

                const combinedChildText = children
                    .map((child) => (child.textContent ?? '').replace(/\s+/g, ' ').trim())
                    .join(' ');

                return hasAnyTimeRegex.test(combinedChildText);
            }
        );

        return repeatedContainerHas24Children ? 24 : 0;
    });
}

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    test.setTimeout(60000);

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

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(placeholderText).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const clamp = (value: number, min: number, max: number) =>
        Math.max(min, Math.min(max, value));

    const candidatePositions = [
        { x: 0.5, y: 0.5 },
        { x: 0.56, y: 0.58 },
        { x: 0.44, y: 0.46 }
    ];

    let forecastLoaded = false;

    for (const candidate of candidatePositions) {
        const previousHighlight = JSON.stringify((await getHighlightedCoordinate(page)) ?? null);
        const position = {
            x: clamp(Math.round(mapBox.width * candidate.x), 20, Math.round(mapBox.width) - 20),
            y: clamp(Math.round(mapBox.height * candidate.y), 20, Math.round(mapBox.height) - 20)
        };

        await mapContainer.click({ position });

        try {
            await expect
                .poll(
                    async () => JSON.stringify((await getHighlightedCoordinate(page)) ?? null),
                    { timeout: 10000 }
                )
                .not.toBe(previousHighlight);

            await expect
                .poll(() => getHighlightedCoordinate(page), { timeout: 10000 })
                .not.toBeUndefined();

            await expect(placeholderText).not.toBeVisible({ timeout: 20000 });

            await expect
                .poll(() => getRenderedForecastEntryCount(weatherForecastSection), {
                    timeout: 20000
                })
                .toBe(24);

            forecastLoaded = true;
            break;
        } catch {
            // Try another unobstructed map position if this click did not load the forecast.
        }
    }

    expect(
        forecastLoaded,
        'Clicking the map did not load a weather forecast with 24 entries.'
    ).toBe(true);

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastHeading).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(placeholderText).not.toBeVisible();

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect.poll(() => getRenderedForecastEntryCount(weatherForecastSection)).toBe(24);
});
