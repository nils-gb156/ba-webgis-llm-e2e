// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const scaleViewer = page.getByTestId('scale-viewer');

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const geocoderResultCandidates = [
    geocoderPanel.getByRole('option', { name: /münster/i }),
    geocoderPanel.getByRole('button', { name: /münster/i }),
    geocoderPanel.getByRole('link', { name: /münster/i }),
    geocoderPanel.getByRole('listitem').filter({ hasText: /münster/i })
  ];

  const getFirstGeocoderResult = async () => {
    for (const candidate of geocoderResultCandidates) {
      if ((await candidate.count()) > 0) {
        return candidate.first();
      }
    }
    return undefined;
  };

  await expect
    .poll(async () => (await getFirstGeocoderResult()) !== undefined, { timeout: 15000 })
    .toBe(true);

  const firstGeocoderResult = await getFirstGeocoderResult();
  if (!firstGeocoderResult) {
    throw new Error('No geocoder result for "Münster" was found.');
  }

  await expect(firstGeocoderResult).toBeVisible();
  await firstGeocoderResult.click();

  await expect(geocoderInput).toHaveValue(/münster/i);

  await expect
    .poll(async () => {
      const currentScaleText = ((await scaleViewer.textContent()) ?? '').trim();
      return currentScaleText !== '' && currentScaleText !== initialScaleText;
    }, { timeout: 15000 })
    .toBe(true);

  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.', { timeout: 20000 });

  const getForecastEntryCount = async () => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const tableRowCount = await weatherForecastSection.locator('tbody tr').count();
    if (tableRowCount > 0) {
      return tableRowCount;
    }

    const articleCount = await weatherForecastSection.locator('article').count();
    if (articleCount > 0) {
      return articleCount;
    }

    return await weatherForecastSection.locator('li').count();
  };

  await expect.poll(getForecastEntryCount, { timeout: 20000 }).toBe(24);
});
