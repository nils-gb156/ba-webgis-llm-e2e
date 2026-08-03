// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const infoPanel = page.getByTestId('info-panel');
    const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
    const geocoderPanel = page.getByTestId('geocoder-panel');
    const forecastSection = page.getByTestId('weather-forecast-section');
    const measurementToggle = page.getByTestId('measurement-toggle');

    const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
    const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

    await expect(layerSwitcher).toBeVisible();
    await expect(infoPanel).toBeVisible();
    await expect(geocoderInput).toBeVisible();
    await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

    await expect(temperatureCheckbox).toBeChecked();
    await expect(precipitationCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

    await expect.poll(() => getMapCenter(page)).toBeTruthy();
    const centerBeforeSearch = (await getMapCenter(page))!;

    await temperatureCheckbox.click({ force: true });
    await expect(temperatureCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

    await precipitationCheckbox.click({ force: true });
    await expect(precipitationCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    await geocoderInput.click();
    await geocoderInput.fill('Münster');

    await expect(geocoderPanel).toBeVisible();
    await expect.poll(async () => {
        const optionCount = await geocoderPanel.getByRole('option').count();
        const buttonCount = await geocoderPanel.getByRole('button').count();
        const listItemCount = await geocoderPanel.getByRole('listitem').count();
        const panelText = ((await geocoderPanel.textContent()) ?? '').toLowerCase();
        return optionCount + buttonCount + listItemCount + (panelText.includes('münster') ? 1 : 0);
    }).toBeGreaterThan(0);

    const optionResults = geocoderPanel.getByRole('option');
    const buttonResults = geocoderPanel.getByRole('button');
    const listItemResults = geocoderPanel.getByRole('listitem');

    if ((await optionResults.count()) > 0) {
        await optionResults.first().click();
    } else if ((await buttonResults.count()) > 0) {
        await buttonResults.first().click();
    } else if ((await listItemResults.count()) > 0) {
        await listItemResults.first().click();
    } else {
        await geocoderInput.press('ArrowDown');
        await geocoderInput.press('Enter');
    }

    await expect.poll(async () => {
        const centerAfterSearch = await getMapCenter(page);
        if (!centerAfterSearch) {
            return 0;
        }
        return Math.hypot(
            centerAfterSearch[0] - centerBeforeSearch[0],
            centerAfterSearch[1] - centerBeforeSearch[1]
        );
    }).toBeGreaterThan(1000);

    await expect(forecastSection).toBeVisible();
    await expect(infoPanel).not.toContainText('Click on the map to load a forecast.');

    await expect.poll(async () => {
        return await forecastSection.evaluate((section) => {
            const roleListItems = section.querySelectorAll('[role="listitem"]').length;
            if (roleListItems > 0) return roleListItems;

            const listItems = section.querySelectorAll('li').length;
            if (listItems > 0) return listItems;

            const roleRows = section.querySelectorAll('[role="row"]').length;
            if (roleRows > 0) return roleRows;

            const tableRows = section.querySelectorAll('tr').length;
            if (tableRows > 0) return tableRows;

            const timeLikeElements = Array.from(section.querySelectorAll('*')).filter((element) => {
                const text = element.textContent?.trim() ?? '';
                return /^([01]?\d|2[0-3]):\d{2}$/.test(text) || /^(1[0-2]|0?\d)\s?(AM|PM)$/i.test(text);
            });
            if (timeLikeElements.length > 0) return timeLikeElements.length;

            return Array.from(section.children).filter((element) => {
                const text = element.textContent?.trim() ?? '';
                return (
                    text.length > 0 &&
                    !/weather forecast/i.test(text) &&
                    !/click on the map to load a forecast/i.test(text)
                );
            }).length;
        });
    }).toBe(24);
});
