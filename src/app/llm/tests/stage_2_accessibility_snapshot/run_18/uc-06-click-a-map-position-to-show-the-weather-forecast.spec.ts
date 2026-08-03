// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

function findTwentyFourEntryArray(value: unknown): number | undefined {
    if (Array.isArray(value)) {
        if (value.length === 24) {
            return 24;
        }

        for (const item of value) {
            const nested = findTwentyFourEntryArray(item);
            if (nested !== undefined) {
                return nested;
            }
        }

        return undefined;
    }

    if (value && typeof value === 'object') {
        for (const nestedValue of Object.values(value as Record<string, unknown>)) {
            const nested = findTwentyFourEntryArray(nestedValue);
            if (nested !== undefined) {
                return nested;
            }
        }
    }

    return undefined;
}

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();

    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const mapContainer = page.getByTestId('map-container');

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');
    await expect(mapContainer).toBeVisible();

    const triggeredRequestUrls: string[] = [];
    const requestListener = (request: Parameters<typeof page.on>[1] extends (event: infer T) => void ? T : never) => {
        if (['fetch', 'xhr'].includes(request.resourceType())) {
            triggeredRequestUrls.push(request.url());
        }
    };
    page.on('request', requestListener);

    let forecastPayload: unknown;
    const forecastResponsePromise = page.waitForResponse(async (response) => {
        if (!response.ok()) {
            return false;
        }

        if (!['fetch', 'xhr'].includes(response.request().resourceType())) {
            return false;
        }

        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.includes('application/json')) {
            return false;
        }

        try {
            const payload = await response.json();
            if (findTwentyFourEntryArray(payload) === 24) {
                forecastPayload = payload;
                return true;
            }
        } catch {
            return false;
        }

        return false;
    });

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.round(mapBox!.width * 0.55),
            y: Math.round(mapBox!.height * 0.45)
        }
    });

    const forecastResponse = await forecastResponsePromise;
    page.off('request', requestListener);

    await expect.poll(() => triggeredRequestUrls.includes(forecastResponse.url())).toBe(true);
    expect(findTwentyFourEntryArray(forecastPayload)).toBe(24);

    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        const [listItems, rows, articles, images] = await Promise.all([
            weatherForecastSection.getByRole('listitem').count(),
            weatherForecastSection.getByRole('row').count(),
            weatherForecastSection.getByRole('article').count(),
            weatherForecastSection.getByRole('img').count()
        ]);

        const textContent = (await weatherForecastSection.textContent()) ?? '';
        const timeLabels =
            Math.max(
                (textContent.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length,
                (textContent.match(/\b\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}\b/g) ?? []).length
            );

        return [listItems, rows, articles, images, timeLabels].includes(24)
            ? 24
            : Math.max(listItems, rows, articles, images, timeLabels);
    }).toBe(24);
});
