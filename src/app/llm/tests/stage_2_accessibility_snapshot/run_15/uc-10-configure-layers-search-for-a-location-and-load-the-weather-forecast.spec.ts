// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const readTrimmedText = async (locator: any) => (((await locator.textContent()) ?? '').trim());

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const scaleViewer = page.getByTestId('scale-viewer');
  const coordinateViewer = page.getByTestId('coordinate-viewer');

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const forecastHint = infoPanel.getByText('Click on the map to load a forecast.');

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect(geocoderInput).toBeVisible();
  await expect(forecastHint).toBeVisible();
  await expect(scaleViewer).toBeVisible();

  const initialScaleText = await readTrimmedText(scaleViewer);
  const initialCoordinateText = await readTrimmedText(coordinateViewer);

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const firstOptionResult = page.getByRole('option').first();
  const firstButtonResult = page.getByRole('button', { name: /Münster/i }).first();

  try {
    await expect(firstOptionResult).toBeVisible({ timeout: 10000 });
    await firstOptionResult.click();
  } catch {
    await expect(firstButtonResult).toBeVisible({ timeout: 10000 });
    await firstButtonResult.click();
  }

  await expect(geocoderInput).toHaveValue(/Münster/i);

  await expect.poll(async () => {
    const currentScaleText = await readTrimmedText(scaleViewer);
    const currentCoordinateText = await readTrimmedText(coordinateViewer);

    const scaleChanged = currentScaleText.length > 0 && currentScaleText !== initialScaleText;
    const coordinateChanged =
      currentCoordinateText.length > 0 && currentCoordinateText !== initialCoordinateText;

    return scaleChanged || coordinateChanged;
  }).toBe(true);

  await expect(forecastHint).not.toBeVisible();

  const countForecastEntries = async () => {
    const listitemCount = await weatherForecastSection.getByRole('listitem').count();
    if (listitemCount > 0) {
      return listitemCount;
    }

    const rowCount = await weatherForecastSection.getByRole('row').count();
    if (rowCount >= 24) {
      return rowCount === 25 ? 24 : rowCount;
    }

    const articleCount = await weatherForecastSection.getByRole('article').count();
    if (articleCount > 0) {
      return articleCount;
    }

    const imageCount = await weatherForecastSection.getByRole('img').count();
    if (imageCount >= 24) {
      return imageCount;
    }

    const sectionText = await readTrimmedText(weatherForecastSection);
    const hourlyMatches = sectionText.match(/\b(?:[01]\d|2[0-3]):00\b/g) ?? [];
    if (hourlyMatches.length > 0) {
      return hourlyMatches.length;
    }

    return 0;
  };

  await expect.poll(countForecastEntries).toBe(24);
});
