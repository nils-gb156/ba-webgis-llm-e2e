// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Hide the Temperature overlay layer.
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
    await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    // Step 2: Show the Precipitation overlay layer.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });
    await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 3: Search for a location using the geocoder.
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
    await geocoderInput.fill('Münster');

    // Step 4: Wait for the result list to appear and select the first result.
    const firstResult = page.getByRole('option').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Step 5: Wait for the map to navigate to the selected location.
    // We poll the map center to confirm it has moved away from the initial extent.
    const initialCenter = await page.evaluate(() => {
        const map = (globalThis as { __openPioneerMap?: { olMap?: { getView: () => { getCenter: () => number[] } } } }).__openPioneerMap;
        return map?.olMap?.getView()?.getCenter();
    });
    await expect.poll(async () => {
        const center = await page.evaluate(() => {
            const map = (globalThis as { __openPioneerMap?: { olMap?: { getView: () => { getCenter: () => number[] } } } }).__openPioneerMap;
            return map?.olMap?.getView()?.getCenter();
        });
        return center && center.length >= 2 && (center[0] !== initialCenter?.[0] || center[1] !== initialCenter?.[1]);
    }).toBe(true);

    // Step 6: Wait for the info panel to load the forecast.
    // The info panel contains a "Weather Forecast" section. Once loaded, it should display
    // 24 entries (one for each hour in a 24-hour forecast).
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    await expect(weatherForecastSection).toBeVisible();
    // The forecast entries are typically rendered as a list or grid of cards.
    // We'll assert that the section contains multiple entries (at least 24).
    // Since we don't have a specific test id for the entries, we count the number of
    // forecast cards or items within the weather-forecast-section.
    // A common pattern is to have a list of items. Let's assume they are list items or divs.
    // We will poll for the count of forecast items to be at least 24.
    await expect.poll(async () => {
        // Try to find forecast items. They might be in a list, or just divs within the section.
        // Let's look for any element that looks like a forecast hour entry.
        // Often, these are in a structure like <div class="forecast-hour"> or similar.
        // Without exact DOM structure, we can count the number of children in the section
        // or look for a specific pattern. Let's assume the section has a list of forecast items.
        // We'll count elements that are likely forecast entries.
        // A safe bet is to count elements that are direct children of the weather-forecast-section
        // if they are distinct forecast cards.
        const count = await page.evaluate(() => {
            const section = document.querySelector('[data-testid="weather-forecast-section"]');
            if (!section) return 0;
            // Try to count list items or divs that represent forecast entries.
            // This is a heuristic. Let's count any element that is a direct child and has some content.
            // Or better, count elements with a specific class if known.
            // Since we don't know the exact class, let's count the number of elements that
            // are likely forecast entries. A common pattern is a list of hours.
            // Let's try counting elements that are likely forecast cards.
            // We'll look for elements that are direct children of the section.
            const children = Array.from(section.children);
            // Filter out potential non-forecast elements like headers
            return children.filter(child => child.tagName.toLowerCase() !== 'h1' && child.tagName.toLowerCase() !== 'h2' && child.tagName.toLowerCase() !== 'h3').length;
        });
        return count >= 24;
    }).toBe(true);
});
