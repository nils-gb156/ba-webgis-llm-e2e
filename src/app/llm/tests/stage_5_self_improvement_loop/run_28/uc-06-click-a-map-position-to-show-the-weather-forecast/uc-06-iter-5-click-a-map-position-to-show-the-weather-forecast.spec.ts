// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // The info panel is visible by default. Ensure it stays open by toggling it off then on.
    const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
    await infoPanelToggle.click({ force: true });
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'false');
    await infoPanelToggle.click({ force: true });
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

    // Click a position on the map canvas.
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({ position: { x: 400, y: 300 } });

    // Wait for the forecast to load: the info panel should no longer contain the initial placeholder text.
    await expect.poll(() =>
        page.getByRole('paragraph', { name: 'Click on the map to load a forecast.', exact: true }).isVisible()
    ).resolves.toBe(false);

    // The clicked position is highlighted on the map.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // The info panel displays a weather forecast section.
    await expect(page.getByRole('heading', { name: 'Weather Forecast', level: 1 })).toBeVisible();

    // The forecast contains 24 entries.
    const weatherSection = page.getByTestId('weather-forecast-section');
    const entryCount = await weatherSection.locator('.forecast-entry').count();
    expect(entryCount).toBe(24);
});
