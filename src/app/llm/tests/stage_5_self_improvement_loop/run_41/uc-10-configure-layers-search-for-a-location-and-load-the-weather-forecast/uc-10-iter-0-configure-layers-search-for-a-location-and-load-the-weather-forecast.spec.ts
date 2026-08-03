// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
    getActiveBaseLayerTitle,
    getHighlightedCoordinate,
    getMapCenter,
    isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
    page
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const geocoderInput = page.getByTestId('geocoder-input');
    const weatherForecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Temperature',
        exact: true
    });
    const precipitationCheckbox = layerSwitcher.getByRole('checkbox', {
        name: 'Precipitation',
        exact: true
    });

    const getForecastEntryCount = async (): Promise<number> => {
        const listItemCount = await weatherForecastSection.getByRole('listitem').count();
        if (listItemCount > 0) {
            return listItemCount;
        }

        const rowCount = await weatherForecastSection.getByRole('row').count();
        if (rowCount > 0) {
            return rowCount;
        }

        return await weatherForecastSection.evaluate((section) => {
            const list = section.querySelector('ul, ol, [role="list"]');
            if (list) {
                return list.children.length;
            }

            const rowGroup = section.querySelector('tbody, [role="rowgroup"]');
            if (rowGroup) {
                return rowGroup.children.length;
            }

            const articleCount = section.querySelectorAll('article').length;
            if (articleCount > 0) {
                return articleCount;
            }

            const timeMatches = section.textContent?.match(/\b(?:[01]\d|2[0-3]):00\b/g) ?? [];
            return timeMatches.length;
        });
    };

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect(weatherForecastSection).toBeVisible();
    await expect(infoPanel).toContainText('Click on the map to load a forecast.');

    await expect.poll(() => getMapCenter(page)).toBeTruthy();
    const centerBeforeSearch = await getMapCenter(page);
    if (!centerBeforeSearch) {
        throw new Error('Map center was not available before the search.');
    }

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    const geocoderPanelTextBeforeSearch = (await geocoderPanel.textContent()) ?? '';

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect
        .poll(async () => {
            const optionCount = await geocoderPanel.getByRole('option').count();
            const listItemCount = await geocoderPanel.getByRole('listitem').count();
            const panelText = (await geocoderPanel.textContent()) ?? '';
            return (
                optionCount +
                listItemCount +
                (panelText !== geocoderPanelTextBeforeSearch && /münster/i.test(panelText) ? 1 : 0)
            );
        })
        .toBeGreaterThan(0);

    const geocoderOptionCount = await geocoderPanel.getByRole('option').count();
    if (geocoderOptionCount > 0) {
        await geocoderPanel.getByRole('option').first().click();
    } else {
        const geocoderListItemCount = await geocoderPanel.getByRole('listitem').count();
        if (geocoderListItemCount > 0) {
            await geocoderPanel.getByRole('listitem').first().click();
        } else {
            await geocoderInput.press('ArrowDown');
            await geocoderInput.press('Enter');
        }
    }

    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            if (!center) {
                return 0;
            }

            return Math.hypot(center[0] - centerBeforeSearch[0], center[1] - centerBeforeSearch[1]);
        })
        .toBeGreaterThan(5000);

    await expect
        .poll(async () => {
            const center = await getMapCenter(page);
            const highlightedCoordinate = await getHighlightedCoordinate(page);
            if (!center || !highlightedCoordinate) {
                return Number.POSITIVE_INFINITY;
            }

            return Math.hypot(
                center[0] - highlightedCoordinate[0],
                center[1] - highlightedCoordinate[1]
            );
        })
        .toBeLessThan(5000);

    await expect(infoPanel).not.toContainText('Click on the map to load a forecast.');
    await expect(weatherForecastSection).toBeVisible();
    await expect.poll(getForecastEntryCount).toBe(24);

    await expect(temperatureCheckbox).not.toBeChecked();
    await expect(precipitationCheckbox).toBeChecked();
});
