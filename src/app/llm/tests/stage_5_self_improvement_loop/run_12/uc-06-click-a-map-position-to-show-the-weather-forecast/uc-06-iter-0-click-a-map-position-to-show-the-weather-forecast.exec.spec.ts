// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate, getMapCenter } from "../../../../map-model-helpers";

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    await expect(mapContainer).toBeVisible();
    await expect.poll(async () => (await getMapCenter(page)) !== undefined).toBe(true);

    await expect(infoPanel).toBeVisible();
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(weatherForecastSection).toBeVisible();
    await expect(
        infoPanel.getByRole('heading', { name: 'Weather Forecast', exact: true })
    ).toBeVisible();
    await expect(weatherForecastSection).toContainText('Click on the map to load a forecast.');

    await expect.poll(() => getHighlightedCoordinate(page)).toBeUndefined();

    const mapBox = await mapContainer.boundingBox();
    expect(mapBox).not.toBeNull();

    await mapContainer.click({
        position: {
            x: Math.round(mapBox!.width * 0.5),
            y: Math.round(mapBox!.height * 0.55)
        }
    });

    await expect.poll(async () => (await getHighlightedCoordinate(page)) !== undefined).toBe(true);
    await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount > 0) {
            return listItemCount;
        }

        const rowCount = await weatherForecastSection.getByRole('row').count();
        if (rowCount > 0) {
            const hasColumnHeaders =
                (await weatherForecastSection.getByRole('columnheader').count()) > 0;
            return hasColumnHeaders ? rowCount - 1 : rowCount;
        }

        const text = await weatherForecastSection.innerText();
        const timeMatches = text.match(/\b(?:[01]?\d|2[0-3]):\d{2}\b/g) ?? [];
        return new Set(timeMatches).size;
    }).toBe(24);
});
