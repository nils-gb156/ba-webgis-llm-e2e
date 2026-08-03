// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderInputContainer = page.getByTestId('geocoder-input');
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const scaleViewer = page.getByTestId('scale-viewer');

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(mapContainer).toBeVisible();
  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInputContainer).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect(scaleViewer).toBeVisible();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
  expect(initialScaleText).not.toBe('');

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');
  await expect(geocoderInput).toHaveValue(/Münster/i);

  const geocoderOptions = geocoderPanel.getByRole('option');
  const geocoderButtons = geocoderPanel.getByRole('button');
  const geocoderLinks = geocoderPanel.getByRole('link');

  await expect(geocoderPanel).toBeVisible();
  await expect
    .poll(async () => {
      const optionCount = await geocoderOptions.count();
      const buttonCount = await geocoderButtons.count();
      const linkCount = await geocoderLinks.count();
      return optionCount > 0 ? 'option' : buttonCount > 0 ? 'button' : linkCount > 0 ? 'link' : '';
    })
    .toMatch(/option|button|link/);

  if (await geocoderOptions.count()) {
    await geocoderOptions.first().click();
  } else if (await geocoderButtons.count()) {
    await geocoderButtons.first().click();
  } else {
    await geocoderLinks.first().click();
  }

  await expect
    .poll(async () => ((await scaleViewer.textContent()) ?? '').trim())
    .not.toBe(initialScaleText);

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).not.toBeVisible();

  await expect
    .poll(async () => {
      const listItemCount = await weatherForecastSection.getByRole('listitem').count();
      const rowCount = await weatherForecastSection.getByRole('row').count();
      const articleCount = await weatherForecastSection.getByRole('article').count();
      const buttonCount = await weatherForecastSection.getByRole('button').count();
      return [listItemCount, rowCount, articleCount, buttonCount];
    })
    .toContain(24);

  await expect(temperatureCheckbox).not.toBeChecked();
  await expect(precipitationCheckbox).toBeChecked();
});
