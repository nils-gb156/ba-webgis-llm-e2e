// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const mapContainer = page.getByTestId('map-container');

    if (await infoPanel.isVisible()) {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    } else {
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
        await infoPanelToggle.click();
        await expect(infoPanel).toBeVisible();
        await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    }

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(
        weatherForecastSection.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);
    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();
    await expect(mapContainer).toBeVisible();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();
    if (!mapBox) {
        throw new Error('Map container has no bounding box.');
    }

    await mapContainer.click({
        position: {
            x: Math.round(mapBox.width * 0.55),
            y: Math.round(mapBox.height * 0.45)
        }
    });

    await expect.poll(async () => (await getHighlightedCoordinate(page)) !== undefined).toBe(true);
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((section) => {
            const isVisible = (element: Element) => {
                const style = window.getComputedStyle(element);
                return style.display !== 'none' && style.visibility !== 'hidden';
            };

            const countVisible = (selector: string) =>
                Array.from(section.querySelectorAll(selector)).filter(isVisible).length;

            const text = section.textContent ?? '';
            const timeMatches24h = text.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g)?.length ?? 0;
            const timeMatches12h =
                text.match(/\b(?:1[0-2]|0?[1-9])\s?(?:AM|PM)\b/gi)?.length ?? 0;

            const candidates = [
                countVisible('[role="listitem"]'),
                countVisible('li'),
                countVisible('tbody tr'),
                Math.max(0, countVisible('[role="row"]') - 1),
                countVisible('article'),
                countVisible('time'),
                countVisible('[datetime]'),
                timeMatches24h,
                timeMatches12h
            ];

            return candidates.find((count) => count === 24) ?? Math.max(...candidates, 0);
        });
    }).toBe(24);
});
