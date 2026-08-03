// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getActiveBaseLayerTitle,
  getMapCenter,
  isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  const centerBeforeSearch = await getMapCenter(page);
  if (!centerBeforeSearch) {
    throw new Error('Map center is not available after map readiness check.');
  }

  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  await expect(geocoderInput).toBeVisible();
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  const firstSearchResult = geocoderPanel.getByRole('option').first();
  await expect(firstSearchResult).toBeVisible();
  await firstSearchResult.click();

  await expect.poll(async () => {
    const centerAfterSearch = await getMapCenter(page);
    if (!centerAfterSearch) {
      return 0;
    }
    return Math.hypot(
      centerAfterSearch[0] - centerBeforeSearch[0],
      centerAfterSearch[1] - centerBeforeSearch[1]
    );
  }).toBeGreaterThan(10000);

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => {
    const bodyRows = await weatherForecastSection.locator('tbody tr').count();
    if (bodyRows > 0) {
      return bodyRows;
    }

    const listItems = await weatherForecastSection.getByRole('listitem').count();
    if (listItems > 0) {
      return listItems;
    }

    const rows = await weatherForecastSection.getByRole('row').count();
    if (rows > 0) {
      const columnHeaders = await weatherForecastSection.getByRole('columnheader').count();
      return columnHeaders > 0 ? rows - 1 : rows;
    }

    return await weatherForecastSection.evaluate((section) => {
      return Array.from(section.children).filter((child) => {
        const text = child.textContent?.trim() ?? '';
        return text.length > 0 && !/^weather forecast$/i.test(text);
      }).length;
    });
  }).toBe(24);
});
