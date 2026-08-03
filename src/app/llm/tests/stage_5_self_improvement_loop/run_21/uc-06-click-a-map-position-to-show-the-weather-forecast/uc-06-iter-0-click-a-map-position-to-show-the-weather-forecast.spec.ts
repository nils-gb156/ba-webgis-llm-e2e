// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

function extractForecastEntryCount(payload: unknown): number | undefined {
    if (!payload || typeof payload !== 'object') {
        return undefined;
    }

    const record = payload as Record<string, unknown>;

    for (const key of ['list', 'entries', 'items', 'data']) {
        const value = record[key];
        if (Array.isArray(value)) {
            return value.length;
        }
    }

    const hourly = record.hourly;
    if (hourly && typeof hourly === 'object') {
        const hourlyRecord = hourly as Record<string, unknown>;
        const lengths = Object.values(hourlyRecord)
            .filter((value): value is unknown[] => Array.isArray(value))
            .map((value) => value.length)
            .filter((length) => length > 0);

        if (lengths.length > 0) {
            return Math.min(...lengths);
        }
    }

    const forecast = record.forecast;
    if (forecast && typeof forecast === 'object') {
        const forecastRecord = forecast as Record<string, unknown>;

        for (const key of ['list', 'entries', 'items', 'data']) {
            const value = forecastRecord[key];
            if (Array.isArray(value)) {
                return value.length;
            }
        }

        const nestedHourly = forecastRecord.hourly;
        if (nestedHourly && typeof nestedHourly === 'object') {
            const nestedHourlyRecord = nestedHourly as Record<string, unknown>;
            const lengths = Object.values(nestedHourlyRecord)
                .filter((value): value is unknown[] => Array.isArray(value))
                .map((value) => value.length)
                .filter((length) => length > 0);

            if (lengths.length > 0) {
                return Math.min(...lengths);
            }
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
    const forecastPlaceholder = weatherForecastSection.getByText('Click on the map to load a forecast.');

    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        const isPressed = await infoPanelToggle.getAttribute('aria-pressed');
        if (isPressed !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();
    await expect(forecastPlaceholder).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

    const highlightBeforeClick = await getHighlightedCoordinate(page);

    const mapBounds = await mapContainer.boundingBox();
    expect(mapBounds).not.toBeNull();
    if (!mapBounds) {
        throw new Error('Map container bounding box is not available.');
    }

    const clickPosition = {
        x: Math.round(mapBounds.width * 0.6),
        y: Math.round(mapBounds.height * 0.45)
    };

    const forecastResponsePromise = page.waitForResponse((response) => {
        return response.ok() && /forecast/i.test(response.url());
    });

    await mapContainer.click({ position: clickPosition });

    const forecastResponse = await forecastResponsePromise;
    const forecastPayload = (await forecastResponse.json()) as unknown;
    expect(extractForecastEntryCount(forecastPayload)).toBe(24);

    if (highlightBeforeClick) {
        await expect
            .poll(async () => {
                const highlight = await getHighlightedCoordinate(page);
                return highlight ? JSON.stringify(highlight) : undefined;
            })
            .not.toBe(JSON.stringify(highlightBeforeClick));
    } else {
        await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(forecastPlaceholder).not.toBeVisible();

    await expect
        .poll(async () => {
            return await weatherForecastSection.evaluate((section) => {
                const elements: Element[] = [section];
                const walker = document.createTreeWalker(section, NodeFilter.SHOW_ELEMENT);

                while (walker.nextNode()) {
                    elements.push(walker.currentNode as Element);
                }

                let largestChildGroup = 0;

                for (const element of elements) {
                    const meaningfulChildren = Array.from(element.children).filter((child) => {
                        const text = child.textContent?.trim() ?? '';
                        return text.length > 0 || child.querySelector('img, svg, canvas') !== null;
                    }).length;

                    if (meaningfulChildren === 24) {
                        return 24;
                    }

                    largestChildGroup = Math.max(largestChildGroup, meaningfulChildren);
                }

                return largestChildGroup;
            });
        })
        .toBe(24);
});
