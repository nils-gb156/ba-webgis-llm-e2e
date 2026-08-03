// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const infoPanel = page.getByTestId('info-panel');
  const geocoderInput = page.getByTestId('geocoder-input');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const scaleViewer = page.getByTestId('scale-viewer');
  const coordinateViewer = page.getByTestId('coordinate-viewer');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  await expect(layerSwitcher).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');
  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect(scaleViewer).toBeVisible();
  await expect(coordinateViewer).toBeVisible();
  await expect(infoPanel.getByText('Click on the map to load a forecast.')).toBeVisible();

  const initialScaleText = ((await scaleViewer.textContent()) ?? '').trim();
  const initialCoordinateText = ((await coordinateViewer.textContent()) ?? '').trim();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderPanel).toContainText(/Münster/i);

  const resultButtons = geocoderPanel.getByRole('button');
  const resultOptions = geocoderPanel.getByRole('option');
  const resultLinks = geocoderPanel.getByRole('link');
  const resultItems = geocoderPanel.getByRole('listitem');

  if ((await resultButtons.count()) > 0) {
    await resultButtons.first().click();
  } else if ((await resultOptions.count()) > 0) {
    await resultOptions.first().click();
  } else if ((await resultLinks.count()) > 0) {
    await resultLinks.first().click();
  } else if ((await resultItems.count()) > 0) {
    await resultItems.first().click();
  } else {
    await geocoderInput.press('ArrowDown');
    await geocoderInput.press('Enter');
  }

  if (initialCoordinateText.length > 0) {
    await expect
      .poll(async () => ((await coordinateViewer.textContent()) ?? '').trim())
      .not.toBe(initialCoordinateText);
  } else {
    await expect
      .poll(async () => ((await scaleViewer.textContent()) ?? '').trim())
      .not.toBe(initialScaleText);
  }

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection.getByRole('listitem')).toHaveCount(24);
});
