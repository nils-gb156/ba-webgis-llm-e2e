// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const forecastHeading = infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true });
    const initialForecastHint = infoPanel.getByText('Click on the map to load a forecast.', { exact: true });

    await expect(mapContainer).toBeVisible();
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    if (!(await infoPanel.isVisible())) {
        await expect(infoPanelToggle).toBeVisible();
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }

    await expect(infoPanel).toBeVisible();
    await expect(forecastHeading).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(initialForecastHint).toBeVisible();

    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.5),
            y: Math.round(mapBox.height * 0.45)
        }
    });

    await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((sectionElement) => {
            const section = sectionElement as HTMLElement;
            const candidateCounts: number[] = [];

            const listItemCount = section.querySelectorAll('[role="listitem"], li').length;
            if (listItemCount > 0) {
                candidateCounts.push(listItemCount);
            }

            const rowCount = Array.from(section.querySelectorAll('[role="row"], tr')).filter((row) => {
                const element = row as HTMLElement;
                if (element.tagName.toLowerCase() === 'tr') {
                    return element.querySelectorAll('td').length > 0;
                }
                return element.querySelectorAll('[role="cell"], [role="gridcell"], td').length > 0;
            }).length;
            if (rowCount > 0) {
                candidateCounts.push(rowCount);
            }

            const accordionItemCount = section.querySelectorAll('button[aria-expanded]').length;
            if (accordionItemCount > 0) {
                candidateCounts.push(accordionItemCount);
            }

            const descendants = [section, ...Array.from(section.getElementsByTagName('*'))];
            for (const element of descendants) {
                const childCount = (element as HTMLElement).children.length;
                if (childCount > 0) {
                    candidateCounts.push(childCount);
                }
            }

            return candidateCounts.find((count) => count === 24) ?? 0;
        });
    }).toBe(24);
});
