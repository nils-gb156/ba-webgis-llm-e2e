// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getHighlightedCoordinate,
  getMapCenter,
  isLayerRendered
} from '../../../../map-model-helpers';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const geocoderInput = page.getByTestId('geocoder-input');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');

  if (!(await layerSwitcher.isVisible()) && (await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

  if (!(await infoPanel.isVisible()) && (await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

  await expect(geocoderInput).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  const measurementToggle = page.getByTestId('measurement-toggle');
  await expect(measurementToggle).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
  const initialCenter = await getMapCenter(page);
  expect(initialCenter).toBeDefined();

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  await expect.poll(async () => {
    const optionCount = await geocoderPanel.getByRole('option').count();
    const buttonCount = await geocoderPanel.getByRole('button', { name: /münster/i }).count();
    const listItemCount = await geocoderPanel.getByRole('listitem').count();
    return optionCount + buttonCount + listItemCount;
  }).toBeGreaterThan(0);

  let firstResult = geocoderPanel.getByRole('option').first();
  if ((await geocoderPanel.getByRole('option').count()) === 0) {
    const resultButtons = geocoderPanel.getByRole('button', { name: /münster/i });
    if ((await resultButtons.count()) > 0) {
      firstResult = resultButtons.first();
    } else {
      firstResult = geocoderPanel.getByRole('listitem').first();
    }
  }

  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect(geocoderInput).toHaveValue(/münster/i);

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    if (!center || !initialCenter) {
      return 0;
    }
    return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
  }).toBeGreaterThan(50000);

  await expect.poll(() => getHighlightedCoordinate(page)).not.toBeUndefined();

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    const highlight = await getHighlightedCoordinate(page);
    if (!center || !highlight) {
      return false;
    }
    return Math.hypot(center[0] - highlight[0], center[1] - highlight[1]) < 50000;
  }).toBe(true);

  await expect(infoPanel.getByText(/Location:\s*Münster/i)).toBeVisible();
  await expect(weatherForecastSection.getByText('Click on the map to load a forecast.')).toHaveCount(0);

  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(async () => await forecastEntries.count()).toBe(24);
});
