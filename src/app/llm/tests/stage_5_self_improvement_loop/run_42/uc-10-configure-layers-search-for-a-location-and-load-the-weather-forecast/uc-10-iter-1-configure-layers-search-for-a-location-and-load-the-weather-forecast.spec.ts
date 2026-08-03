// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Geocoder search', exact: true })).toBeVisible();

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

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
      return centerBeforeSearch;
    })
    .not.toBeUndefined();

  if (!centerBeforeSearch) {
    throw new Error('Map center is not available after the initial readiness checks.');
  }

  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  await geocoderInput.click();
  await geocoderInput.fill('Münster');
  await expect(geocoderInput).toHaveValue('Münster');

  const geocoderResults = page.getByTestId('geocoder-results');
  await expect(geocoderResults).toBeVisible({ timeout: 15000 });

  const firstSearchResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstSearchResult).toBeVisible({ timeout: 15000 });
  await expect(firstSearchResult).toContainText('Münster');

  await firstSearchResult.click();

  await expect
    .poll(
      async () => {
        const centerAfterSearch = await getMapCenter(page);
        if (!centerAfterSearch) {
          return 0;
        }

        return Math.hypot(
          centerAfterSearch[0] - centerBeforeSearch[0],
          centerAfterSearch[1] - centerBeforeSearch[1]
        );
      },
      { timeout: 20000 }
    )
    .toBeGreaterThan(10000);

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  await expect
    .poll(
      async () =>
        await weatherForecastSection.evaluate((section) => {
          const tbodyRows = section.querySelectorAll('tbody tr').length;
          if (tbodyRows > 0) {
            return tbodyRows;
          }

          const roleRows = section.querySelectorAll('[role="row"]').length;
          const columnHeaders = section.querySelectorAll('[role="columnheader"]').length;
          if (roleRows > 0) {
            return columnHeaders > 0 ? Math.max(roleRows - 1, 0) : roleRows;
          }

          const roleListItems = section.querySelectorAll('[role="listitem"]').length;
          if (roleListItems > 0) {
            return roleListItems;
          }

          const listItems = section.querySelectorAll('li').length;
          if (listItems > 0) {
            return listItems;
          }

          const exactTimeLabels = new Set(
            Array.from(section.querySelectorAll('*'))
              .map((element) => (element.textContent ?? '').trim())
              .filter((text) => /^([01]\d|2[0-3]):[0-5]\d$/.test(text))
          );
          if (exactTimeLabels.size > 0) {
            return exactTimeLabels.size;
          }

          const images = section.querySelectorAll('img').length;
          if (images === 24) {
            return images;
          }

          return Array.from(section.children).filter((child) => {
            const text = (child.textContent ?? '').trim();
            return (
              text.length > 0 &&
              !/^weather forecast$/i.test(text) &&
              !/^click on the map to load a forecast\.?$/i.test(text)
            );
          }).length;
        }),
      { timeout: 30000 }
    )
    .toBe(24);

  await expect(temperatureCheckbox).not.toBeChecked();
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
});
