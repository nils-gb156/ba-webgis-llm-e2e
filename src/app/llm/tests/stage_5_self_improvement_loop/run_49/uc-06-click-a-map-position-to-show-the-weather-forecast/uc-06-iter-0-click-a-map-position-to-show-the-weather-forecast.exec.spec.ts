// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapZoomLevel } from "../../../../map-model-helpers";

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(layerSwitcher).toBeVisible();
    await expect(mapContainer).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText('Weather Forecast');
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

    const forecastResponseEntryCounts: number[] = [];

    const extractForecastEntryCount = (value: unknown): number | undefined => {
        if (Array.isArray(value)) {
            if (value.length === 24) {
                return 24;
            }
            for (const item of value) {
                const nested = extractForecastEntryCount(item);
                if (nested === 24) {
                    return nested;
                }
            }
            return undefined;
        }

        if (value && typeof value === 'object') {
            const record = value as Record<string, unknown>;

            for (const key of ['forecast', 'forecasts', 'entries', 'hourly', 'timeseries', 'data', 'properties']) {
                const nested = extractForecastEntryCount(record[key]);
                if (nested === 24) {
                    return nested;
                }
            }

            for (const nestedValue of Object.values(record)) {
                const nested = extractForecastEntryCount(nestedValue);
                if (nested === 24) {
                    return nested;
                }
            }
        }

        return undefined;
    };

    page.on('response', async (response) => {
        try {
            if (!response.ok()) {
                return;
            }

            const resourceType = response.request().resourceType();
            if (resourceType !== 'fetch' && resourceType !== 'xhr') {
                return;
            }

            const contentType = response.headers()['content-type'] ?? '';
            if (!contentType.includes('application/json')) {
                return;
            }

            const data = await response.json();
            const count = extractForecastEntryCount(data);
            if (count !== undefined) {
                forecastResponseEntryCounts.push(count);
            }
        } catch {
            // Ignore non-JSON or otherwise unreadable responses.
        }
    });

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.58),
            y: Math.round(mapBox.height * 0.55)
        }
    });

    await expect.poll(async () => (await getHighlightedCoordinate(page))?.length).toBe(2);
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        const responseCount = forecastResponseEntryCounts.find((count) => count === 24);
        if (responseCount !== undefined) {
            return responseCount;
        }

        return await weatherForecastSection.evaluate((section) => {
            const text = section.textContent ?? '';
            if (/click on the map to load a forecast\./i.test(text)) {
                return 0;
            }

            const listItemCount = section.querySelectorAll('li, [role="listitem"], article').length;
            if (listItemCount > 0) {
                return listItemCount;
            }

            for (const table of Array.from(section.querySelectorAll('table'))) {
                const bodyRowCount = table.querySelectorAll('tbody tr').length;
                if (bodyRowCount > 0) {
                    return bodyRowCount;
                }

                const rowCount = table.querySelectorAll('tr').length;
                if (rowCount > 1) {
                    return rowCount - 1;
                }
            }

            const directChildGroupCount = Array.from(section.children).reduce((max, child) => {
                return Math.max(max, child.children.length);
            }, 0);

            const timeLabelCount = text.match(/\b\d{1,2}:\d{2}\b/g)?.length ?? 0;

            return Math.max(directChildGroupCount, timeLabelCount);
        });
    }).toBe(24);
});
