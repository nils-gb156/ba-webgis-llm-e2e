// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();
    await expect(infoPanelToggle).toBeVisible();

    const infoPanelVisible = await infoPanel.isVisible();
    const infoPanelPressed = (await infoPanelToggle.getAttribute('aria-pressed')) === 'true';
    if (!infoPanelVisible && !infoPanelPressed) {
        await infoPanelToggle.click();
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => (await getHighlightedCoordinate(page))?.length ?? 0).toBe(0);

    const mapBox = await mapContainer.boundingBox();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.58),
            y: Math.round(mapBox.height * 0.56)
        }
    });

    await expect.poll(async () => (await getHighlightedCoordinate(page))?.length ?? 0).toBe(2);
    await expect(weatherForecastSection).toBeVisible();
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect
        .poll(async () => {
            const listItemCount = await weatherForecastSection.getByRole('listitem').count();
            const imageCount = await weatherForecastSection.getByRole('img').count();
            const text = (await weatherForecastSection.textContent()) ?? '';
            const timeLabelCount = (text.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length;
            const isolatedTimeLabelElementCount = await weatherForecastSection.evaluate((section) => {
                return Array.from(section.querySelectorAll('*')).filter((element) =>
                    /^\d{1,2}:\d{2}$/.test((element.textContent ?? '').trim())
                ).length;
            });

            return [listItemCount, imageCount, timeLabelCount, isolatedTimeLabelElementCount];
        })
        .toContain(24);
});
