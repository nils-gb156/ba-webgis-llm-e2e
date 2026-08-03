// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate } from "../../../../map-model-helpers";

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanelToggle).toBeVisible();

    if (!(await infoPanel.isVisible())) {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(weatherForecastSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();

    await expect.poll(async () => (await getMapCenter(page))?.length ?? 0).toBe(2);

    const getForecastEntryCount = async (): Promise<number> =>
        await weatherForecastSection.evaluate((section) => {
            const roleListItems = section.querySelectorAll('[role="listitem"]');
            if (roleListItems.length > 0) {
                return roleListItems.length;
            }

            const listItems = section.querySelectorAll('li');
            if (listItems.length > 0) {
                return listItems.length;
            }

            const bodyRows = section.querySelectorAll('tbody tr');
            if (bodyRows.length > 0) {
                return bodyRows.length;
            }

            const tables = Array.from(section.querySelectorAll('table'));
            for (const table of tables) {
                const rows = table.querySelectorAll('tr');
                if (rows.length > 1) {
                    return rows.length - 1;
                }
            }

            const roleRows = section.querySelectorAll('[role="row"]');
            if (roleRows.length > 1) {
                return roleRows.length - 1;
            }

            const definitionTerms = section.querySelectorAll('dt');
            if (definitionTerms.length > 0) {
                return definitionTerms.length;
            }

            const articles = section.querySelectorAll('article');
            if (articles.length > 0) {
                return articles.length;
            }

            const timeElements = section.querySelectorAll('time');
            if (timeElements.length > 0) {
                return timeElements.length;
            }

            const timePattern24h = /^([01]\d|2[0-3]):[0-5]\d$/;
            const timePattern12h = /^(1[0-2]|0?[1-9])(?::[0-5]\d)?\s?(AM|PM)$/i;

            const leafTexts = Array.from(section.querySelectorAll('div, p, span, td, th, strong, b'))
                .filter((element) => element.children.length === 0)
                .map((element) => element.textContent?.trim() ?? '')
                .filter((text) => timePattern24h.test(text) || timePattern12h.test(text));

            return new Set(leafTexts).size;
        });

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    const clickPosition = {
        x: Math.floor(mapBox.width * 0.55),
        y: Math.floor(mapBox.height * 0.6)
    };

    await mapContainer.click({ position: clickPosition });

    await expect.poll(async () => (await getHighlightedCoordinate(page))?.length ?? 0).toBe(2);
    await expect(weatherForecastSection).toBeVisible();
    await expect.poll(() => getForecastEntryCount()).toBe(24);
});
