// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const findForecastEntryCount = (value: unknown): number => {
        if (Array.isArray(value)) {
            return value.length === 24 ? 24 : 0;
        }

        if (value && typeof value === 'object') {
            for (const nestedValue of Object.values(value as Record<string, unknown>)) {
                const nestedCount = findForecastEntryCount(nestedValue);
                if (nestedCount === 24) {
                    return 24;
                }
            }
        }

        return 0;
    };

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    const temperatureLayerLabel = page.getByText(/^Temperature$/i);
    const precipitationLayerLabel = page.getByText(/^Precipitation$/i);
    await expect(temperatureLayerLabel).toBeVisible();
    await expect(precipitationLayerLabel).toBeVisible();

    const temperatureToggle = page.getByRole('checkbox', { name: /^Temperature$/i });
    const precipitationToggle = page.getByRole('checkbox', { name: /^Precipitation$/i });

    await expect(temperatureToggle).toBeChecked();
    await expect(precipitationToggle).not.toBeChecked();

    const searchField = page.getByRole('combobox').first();
    await expect(searchField).toBeVisible();

    await temperatureToggle.click({ force: true });
    await expect(temperatureToggle).not.toBeChecked();

    await precipitationToggle.click({ force: true });
    await expect(precipitationToggle).toBeChecked();

    const forecastRequestUrls: string[] = [];
    page.on('request', request => {
        if (/forecast/i.test(request.url())) {
            forecastRequestUrls.push(request.url());
        }
    });

    const forecastResponsePromise = page.waitForResponse(response => {
        return response.ok() && /forecast/i.test(response.url());
    });

    await searchField.click();
    await searchField.fill('Münster');

    const firstSearchResult = page.getByRole('option').first();
    await expect(firstSearchResult).toBeVisible();

    const selectedResultText = ((await firstSearchResult.textContent()) ?? '').trim();
    await firstSearchResult.click();

    if (selectedResultText) {
        await expect(searchField).toHaveValue(new RegExp(escapeRegExp(selectedResultText), 'i'));
    } else {
        await expect(searchField).toHaveValue(/Münster/i);
    }

    await expect(firstSearchResult).not.toBeVisible();

    await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(0);

    const forecastResponse = await forecastResponsePromise;
    const forecastPayload = await forecastResponse.json();

    await expect(page.getByRole('heading', { name: /weather forecast/i })).toBeVisible();
    expect(findForecastEntryCount(forecastPayload)).toBe(24);
});
