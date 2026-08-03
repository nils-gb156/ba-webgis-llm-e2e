// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(geocoderInput).toBeEditable();
    await expect(weatherForecastSection).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    const temperatureCheckbox = page.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = page.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    let initialCenter: [number, number] | undefined;
    await expect.poll(async () => {
        initialCenter = await getMapCenter(page);
        return initialCenter;
    }).toBeTruthy();

    if (!initialCenter) {
        throw new Error('Map center was not available before starting the user flow.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    const geocoderResults = page.getByTestId('geocoder-results');
    const firstResult = page.getByTestId('geocoder-result-item-0');

    await expect(geocoderResults).toBeVisible();
    await expect(firstResult).toBeVisible();
    await expect(firstResult).toContainText(/Münster/i);

    await firstResult.click();

    await expect(geocoderInput).toHaveValue(/Münster/i);

    await expect.poll(async () => {
        const center = await getMapCenter(page);
        if (!center) {
            return 0;
        }

        return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
    }).toBeGreaterThan(10000);

    await expect(infoPanel).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        return await weatherForecastSection.evaluate((section) => {
            const candidateCounts = new Set<number>();

            for (const selector of [
                '[data-testid^="weather-forecast-item"]',
                '[role="listitem"]',
                'li',
                'article',
                'time',
                'tbody > tr'
            ]) {
                candidateCounts.add(section.querySelectorAll(selector).length);
            }

            const containers = [
                section,
                ...Array.from(
                    section.querySelectorAll(
                        'ul, ol, tbody, [role="list"], [role="grid"], [role="table"], div, section'
                    )
                )
            ];

            for (const container of containers) {
                const childCount = Array.from(container.children).filter((child) => {
                    return (child.textContent?.trim() ?? '').length > 0;
                }).length;
                candidateCounts.add(childCount);
            }

            if (candidateCounts.has(24)) {
                return 24;
            }

            return Math.max(...candidateCounts);
        });
    }).toBe(24);
});
