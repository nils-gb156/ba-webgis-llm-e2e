// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getMapCenter,
    getMapZoomLevel,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }
    await expect(layerSwitcher).toBeVisible();

    const infoPanel = page.getByTestId('info-panel');
    const infoPanelToggle = page.getByTestId('info-panel-toggle');
    if (!(await infoPanel.isVisible())) {
        if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
            await infoPanelToggle.click();
        }
    }
    await expect(infoPanel).toBeVisible();

    await expect(page.getByTestId('measurement-toggle')).not.toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('textbox', { name: 'Geocoder search', exact: true })).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    let centerBeforeSearch: [number, number] | undefined;
    await expect
        .poll(async () => {
            centerBeforeSearch = await getMapCenter(page);
            return centerBeforeSearch !== undefined;
        })
        .toBe(true);

    let zoomBeforeSearch: number | undefined;
    await expect
        .poll(async () => {
            zoomBeforeSearch = await getMapZoomLevel(page);
            return zoomBeforeSearch !== undefined;
        })
        .toBe(true);

    const readForecastEntryCount = (payload: unknown): number | undefined => {
        if (Array.isArray(payload)) {
            return payload.length;
        }
        if (!payload || typeof payload !== 'object') {
            return undefined;
        }

        const record = payload as Record<string, unknown>;

        if (Array.isArray(record.entries)) {
            return record.entries.length;
        }
        if (Array.isArray(record.forecast)) {
            return record.forecast.length;
        }
        if (Array.isArray(record.list)) {
            return record.list.length;
        }
        if (Array.isArray(record.data)) {
            return record.data.length;
        }

        const hourly = record.hourly;
        if (hourly && typeof hourly === 'object') {
            const hourlyRecord = hourly as Record<string, unknown>;
            if (Array.isArray(hourlyRecord.time)) {
                return hourlyRecord.time.length;
            }
            if (Array.isArray(hourlyRecord.temperature_2m)) {
                return hourlyRecord.temperature_2m.length;
            }
            if (Array.isArray(hourlyRecord.precipitation)) {
                return hourlyRecord.precipitation.length;
            }
        }

        return undefined;
    };

    let forecastEntryCount: number | undefined;
    const forecastResponsePromise = page.waitForResponse(async (response) => {
        if (!response.ok()) {
            return false;
        }

        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.includes('application/json')) {
            return false;
        }

        const url = response.url().toLowerCase();
        if (!url.includes('forecast') && !url.includes('weather')) {
            return false;
        }

        try {
            const payload = await response.json();
            const count = readForecastEntryCount(payload);
            if (count === 24) {
                forecastEntryCount = count;
                return true;
            }
        } catch {
            return false;
        }

        return false;
    });

    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect
        .poll(async () => {
            const optionCount = await page.getByRole('option', { name: /Münster/i }).count();
            const buttonCount = await page.getByRole('button', { name: /Münster/i }).count();
            const listItemCount = await page.getByRole('listitem').filter({ hasText: /Münster/i }).count();
            return optionCount + buttonCount + listItemCount;
        })
        .toBeGreaterThan(0);

    const optionResults = page.getByRole('option', { name: /Münster/i });
    if ((await optionResults.count()) > 0) {
        await optionResults.first().click();
    } else {
        const buttonResults = page.getByRole('button', { name: /Münster/i });
        if ((await buttonResults.count()) > 0) {
            await buttonResults.first().click();
        } else {
            await page.getByRole('listitem').filter({ hasText: /Münster/i }).first().click();
        }
    }

    await expect
        .poll(async () => {
            const currentCenter = await getMapCenter(page);
            const currentZoom = await getMapZoomLevel(page);

            if (
                !centerBeforeSearch ||
                !currentCenter ||
                zoomBeforeSearch === undefined ||
                currentZoom === undefined
            ) {
                return false;
            }

            const dx = Math.abs(currentCenter[0] - centerBeforeSearch[0]);
            const dy = Math.abs(currentCenter[1] - centerBeforeSearch[1]);
            const zoomChanged = Math.abs(currentZoom - zoomBeforeSearch) >= 1;

            return dx > 1000 || dy > 1000 || zoomChanged;
        })
        .toBe(true);

    await forecastResponsePromise;
    expect(forecastEntryCount).toBe(24);

    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
    await expect(page.getByText('Click on the map to load a forecast.', { exact: true })).not.toBeVisible();
});
