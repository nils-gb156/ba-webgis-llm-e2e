// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const measurementToggle = page.getByTestId('measurement-toggle');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');

    const temperatureCheckbox = page.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = page.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    const findForecastEntryCount = (value: unknown, forecastContext = false): number | undefined => {
        if (Array.isArray(value)) {
            if (forecastContext && value.length === 24) {
                return 24;
            }

            for (const item of value) {
                const nested = findForecastEntryCount(item, forecastContext);
                if (nested !== undefined) {
                    return nested;
                }
            }

            return undefined;
        }

        if (!value || typeof value !== 'object') {
            return undefined;
        }

        for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
            const nested = findForecastEntryCount(
                nestedValue,
                forecastContext || /forecast|hourly|timeseries|hours|weather/i.test(key)
            );
            if (nested !== undefined) {
                return nested;
            }
        }

        return undefined;
    };

    const getDisplayedForecastEntryCount = async (): Promise<number> => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount > 0) {
            return listItemCount;
        }

        const rowCount = await weatherForecastSection.getByRole('row').count();
        if (rowCount === 25) {
            return 24;
        }
        if (rowCount === 24) {
            return 24;
        }

        return await page.evaluate(() => {
            const section = document.querySelector('[data-testid="weather-forecast-section"]');
            if (!section) {
                return 0;
            }

            const leafTexts = Array.from(section.querySelectorAll('*'))
                .filter((element) => element.children.length === 0)
                .map((element) => (element.textContent ?? '').trim())
                .filter(Boolean);

            const uniqueTimeLabels = new Set(
                leafTexts.filter((text) =>
                    /^([01]?\d|2[0-3]):[0-5]\d$/.test(text) ||
                    /^(0?\d|1\d|2[0-3])\s*h$/.test(text) ||
                    /^(0?\d|1[0-2])\s?(AM|PM)$/i.test(text) ||
                    /^[A-Z][a-z]{2}\s+([01]?\d|2[0-3]):[0-5]\d$/.test(text)
                )
            );

            return uniqueTimeLabels.size;
        });
    };

    await expect(layerSwitcherToggle).toBeVisible();
    await expect(infoPanelToggle).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    let initialCenter: [number, number] | undefined;
    await expect.poll(async () => {
        initialCenter = await getMapCenter(page);
        return initialCenter !== undefined;
    }, { timeout: 15000 }).toBe(true);

    if (!initialCenter) {
        throw new Error('Map center was not available after application load.');
    }

    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(temperatureCheckbox).toBeVisible();
    await expect(precipitationCheckbox).toBeVisible();

    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
        await infoPanelToggle.click();
    }
    await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(false);

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature'), { timeout: 15000 }).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation'), { timeout: 15000 }).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');
    await expect(geocoderInput).toHaveValue(/M(?:ü|u)nster/i);

    const optionResult = geocoderPanel.getByRole('option', { name: /M(?:ü|u)nster/i }).first();
    const listItemResult = geocoderPanel.getByRole('listitem').filter({ hasText: /M(?:ü|u)nster/i }).first();
    const buttonResult = geocoderPanel.getByRole('button', { name: /M(?:ü|u)nster/i }).first();
    const textResult = geocoderPanel.getByText(/M(?:ü|u)nster/i).first();

    await expect.poll(async () => {
        const optionCount = await optionResult.count();
        const listItemCount = await listItemResult.count();
        const buttonCount = await buttonResult.count();
        const textCount = await textResult.count();
        return optionCount + listItemCount + buttonCount + textCount;
    }, { timeout: 15000 }).toBeGreaterThan(0);

    let forecastEntryCountFromResponse: number | undefined;
    const forecastResponsePromise = page.waitForResponse(async (response) => {
        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.includes('application/json')) {
            return false;
        }

        try {
            const json = await response.json();
            forecastEntryCountFromResponse = findForecastEntryCount(json);
            return forecastEntryCountFromResponse === 24;
        } catch {
            return false;
        }
    }, { timeout: 30000 });

    if (await optionResult.count()) {
        await optionResult.click();
    } else if (await listItemResult.count()) {
        await listItemResult.click();
    } else if (await buttonResult.count()) {
        await buttonResult.click();
    } else {
        await geocoderInput.press('ArrowDown');
        await geocoderInput.press('Enter');
    }

    await forecastResponsePromise;
    await expect(forecastEntryCountFromResponse).toBe(24);
    await expect(geocoderInput).toHaveValue(/M(?:ü|u)nster/i);

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        if (!currentCenter) {
            return 0;
        }

        return Math.hypot(currentCenter[0] - initialCenter[0], currentCenter[1] - initialCenter[1]);
    }, { timeout: 30000 }).toBeGreaterThan(10000);

    await expect.poll(async () => {
        const highlight = await getHighlightedCoordinate(page);
        return highlight !== undefined;
    }, { timeout: 30000 }).toBe(true);

    await expect.poll(async () => {
        const currentCenter = await getMapCenter(page);
        const highlight = await getHighlightedCoordinate(page);

        if (!currentCenter || !highlight) {
            return Number.POSITIVE_INFINITY;
        }

        return Math.hypot(currentCenter[0] - highlight[0], currentCenter[1] - highlight[1]);
    }, { timeout: 30000 }).toBeLessThan(150000);

    await expect(infoPanel).toBeVisible();
    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel.getByText('Click on the map to load a forecast.')).toHaveCount(0);
    await expect.poll(() => getDisplayedForecastEntryCount(), { timeout: 30000 }).toBe(24);
});
