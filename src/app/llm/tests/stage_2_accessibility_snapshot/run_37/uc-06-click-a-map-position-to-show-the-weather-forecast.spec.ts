// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('load');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const mapContainer = page.getByTestId('map-container');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toBeVisible();
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    const findForecastEntryCount = (value: unknown): number | undefined => {
        const visited = new Set<unknown>();

        const walk = (node: unknown): number | undefined => {
            if (node === null || node === undefined || typeof node !== 'object') {
                return undefined;
            }
            if (visited.has(node)) {
                return undefined;
            }
            visited.add(node);

            if (Array.isArray(node)) {
                if (
                    node.length === 24 &&
                    node.every((item) => item !== null && typeof item === 'object')
                ) {
                    return 24;
                }

                for (const item of node) {
                    const result = walk(item);
                    if (result !== undefined) {
                        return result;
                    }
                }
                return undefined;
            }

            for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
                const normalizedKey = key.toLowerCase();
                if (
                    Array.isArray(value) &&
                    value.length === 24 &&
                    (/(forecast|hour|hourly|time|timeseries|entry|entries|item|items|data)/.test(normalizedKey) ||
                        value.every((item) => item !== null && typeof item === 'object'))
                ) {
                    return 24;
                }

                const result = walk(value);
                if (result !== undefined) {
                    return result;
                }
            }

            return undefined;
        };

        return walk(value);
    };

    let captureForecastResponses = false;
    let forecastRequestUrl: string | undefined;
    let forecastEntryCountFromResponse: number | undefined;

    page.on('response', async (response) => {
        if (!captureForecastResponses) {
            return;
        }

        const resourceType = response.request().resourceType();
        if (resourceType !== 'fetch' && resourceType !== 'xhr') {
            return;
        }

        if (!response.ok()) {
            return;
        }

        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.includes('application/json')) {
            return;
        }

        try {
            const json = await response.json();
            const entryCount = findForecastEntryCount(json);
            if (entryCount === 24) {
                forecastRequestUrl = response.url();
                forecastEntryCountFromResponse = entryCount;
            }
        } catch {
            // Ignore non-JSON or unrelated JSON responses.
        }
    });

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    captureForecastResponses = true;
    await mapContainer.click({
        position: {
            x: Math.floor((mapBox?.width ?? 0) * 0.5),
            y: Math.floor((mapBox?.height ?? 0) * 0.4)
        }
    });

    await expect.poll(() => forecastRequestUrl).toBeTruthy();
    await expect.poll(() => forecastEntryCountFromResponse).toBe(24);
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    const getDisplayedForecastEntryCount = async (): Promise<number> => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount === 24) {
            return 24;
        }

        const rowCount = await weatherForecastSection.getByRole('row').count();
        if (rowCount === 24) {
            return 24;
        }

        const articleCount = await weatherForecastSection.getByRole('article').count();
        if (articleCount === 24) {
            return 24;
        }

        return await weatherForecastSection.evaluate((section) => {
            const isHeadingElement = (element: Element): boolean => {
                const role = element.getAttribute('role');
                if (role === 'heading') {
                    return true;
                }

                const tagName = element.tagName.toLowerCase();
                return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName);
            };

            const counts: number[] = [];

            const walk = (element: Element): void => {
                const relevantChildren = Array.from(element.children).filter((child) => !isHeadingElement(child));
                if (relevantChildren.length > 0) {
                    counts.push(relevantChildren.length);
                }

                for (const child of Array.from(element.children)) {
                    walk(child);
                }
            };

            walk(section);

            if (counts.includes(24)) {
                return 24;
            }

            const sectionChildren = Array.from(section.children).filter((child) => !isHeadingElement(child));
            if (sectionChildren.length === 25) {
                return 24;
            }

            return 0;
        });
    };

    await expect.poll(getDisplayedForecastEntryCount).toBe(24);
});
