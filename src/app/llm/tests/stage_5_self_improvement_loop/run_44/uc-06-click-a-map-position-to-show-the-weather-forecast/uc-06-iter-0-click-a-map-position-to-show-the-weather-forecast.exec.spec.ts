// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getHighlightedCoordinate } from "../../../../map-model-helpers";

function findForecastEntryCount(value: unknown): number | undefined {
    if (Array.isArray(value)) {
        if (value.length === 24) {
            return value.length;
        }

        for (const item of value) {
            const nestedCount = findForecastEntryCount(item);
            if (nestedCount === 24) {
                return nestedCount;
            }
        }

        return undefined;
    }

    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const prioritizedKeys = ["forecast", "forecasts", "entries", "items", "hourly", "timeseries", "timeSeries", "data"];

        for (const key of prioritizedKeys) {
            if (key in record) {
                const nestedCount = findForecastEntryCount(record[key]);
                if (nestedCount === 24) {
                    return nestedCount;
                }
            }
        }

        for (const nestedValue of Object.values(record)) {
            const nestedCount = findForecastEntryCount(nestedValue);
            if (nestedCount === 24) {
                return nestedCount;
            }
        }
    }

    return undefined;
}

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const mapContainer = page.getByTestId('map-container');

    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const initialWeatherSectionText = ((await weatherForecastSection.textContent()) ?? '').trim();

    let forecastEntryCount: number | undefined;
    const forecastResponsePromise = page.waitForResponse(async (response) => {
        const resourceType = response.request().resourceType();
        if (resourceType !== 'fetch' && resourceType !== 'xhr') {
            return false;
        }

        if (!response.ok()) {
            return false;
        }

        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.includes('application/json')) {
            return false;
        }

        try {
            const body = await response.json();
            const count = findForecastEntryCount(body);
            if (count === 24) {
                forecastEntryCount = count;
                return true;
            }
        } catch {
            return false;
        }

        return false;
    });

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.55),
            y: Math.round(mapBox.height * 0.55)
        }
    });

    await forecastResponsePromise;
    await expect(forecastEntryCount).toBe(24);

    await expect.poll(async () => (await getHighlightedCoordinate(page)) !== undefined).toBe(true);
    await expect(weatherForecastSection).toBeVisible();
    await expect.poll(async () => {
        return ((await weatherForecastSection.textContent()) ?? '').trim() !== initialWeatherSectionText;
    }).toBe(true);

    await expect.poll(async () => {
        const uiEntryCount = await weatherForecastSection.evaluate((section) => {
            const roleListItems = section.querySelectorAll('[role="listitem"]').length;
            if (roleListItems > 0) {
                return roleListItems;
            }

            const listItems = section.querySelectorAll('li').length;
            if (listItems > 0) {
                return listItems;
            }

            const tableRows = section.querySelectorAll('tbody tr').length;
            if (tableRows > 0) {
                return tableRows;
            }

            const roleRows = section.querySelectorAll('[role="row"]').length;
            if (roleRows > 1) {
                return roleRows - 1;
            }

            const exactChildContainer = Array.from(section.querySelectorAll<HTMLElement>('*')).find(
                (element) => element.children.length === 24
            );
            if (exactChildContainer) {
                return exactChildContainer.children.length;
            }

            return 0;
        });

        return uiEntryCount || forecastEntryCount || 0;
    }).toBe(24);
});
