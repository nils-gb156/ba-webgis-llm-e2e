// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const mapContainer = page.getByTestId('map-container');

    await expect(infoPanelToggle).toBeVisible();

    const infoPanelVisibleInitially = await infoPanel.isVisible();
    const infoPanelPressedInitially = await infoPanelToggle.getAttribute('aria-pressed');

    if (!infoPanelVisibleInitially && infoPanelPressedInitially !== 'true') {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true })
    ).toBeVisible();
    await expect(mapContainer).toBeVisible();

    await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);

    const initialHighlight = await getHighlightedCoordinate(page);
    const initialHighlightKey = initialHighlight ? JSON.stringify(initialHighlight) : undefined;

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container bounding box is not available.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.7),
            y: Math.round(mapBox.height * 0.45)
        }
    });

    await expect
        .poll(async () => {
            const coordinate = await getHighlightedCoordinate(page);
            return coordinate ? JSON.stringify(coordinate) : undefined;
        })
        .not.toBe(initialHighlightKey);

    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByText('Click on the map to load a forecast.', { exact: true })
    ).toBeHidden();

    await expect
        .poll(async () => {
            return await weatherForecastSection.evaluate((section) => {
                const roleListItems = section.querySelectorAll('[role="listitem"]').length;
                if (roleListItems > 0) {
                    return roleListItems;
                }

                const listItems = section.querySelectorAll('li').length;
                if (listItems > 0) {
                    return listItems;
                }

                const articles = section.querySelectorAll('article').length;
                if (articles > 0) {
                    return articles;
                }

                const candidates = [section, ...Array.from(section.querySelectorAll<HTMLElement>('*'))];
                for (const candidate of candidates) {
                    const children = Array.from(candidate.children) as HTMLElement[];
                    if (children.length !== 24) {
                        continue;
                    }

                    const substantialChildren = children.filter((child) => {
                        const text = child.innerText.trim();
                        return text.length > 0 || child.querySelector('img, svg, canvas') !== null;
                    });

                    if (substantialChildren.length === 24) {
                        return 24;
                    }
                }

                const timeLabelMatches = section.innerText.match(/\b\d{1,2}:\d{2}\b/g)?.length ?? 0;
                if (timeLabelMatches > 0) {
                    return timeLabelMatches;
                }

                const imageCount = section.querySelectorAll('img').length;
                if (imageCount > 0) {
                    return imageCount;
                }

                return 0;
            });
        })
        .toBe(24);
});
