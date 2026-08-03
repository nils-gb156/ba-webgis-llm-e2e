// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getActiveBaseLayerTitle,
  getHighlightedCoordinate,
  getMapCenter,
  getMapZoomLevel,
  isLayerRendered
} from '../../../../map-model-helpers';

test('UC10 Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');

  const geocoderInput = page.getByTestId('geocoder-input');
  await expect(geocoderInput).toBeVisible();

  const measurementToggle = page.getByTestId('measurement-toggle');
  await expect(measurementToggle).toBeVisible();
  expect(await measurementToggle.getAttribute('aria-pressed')).not.toBe('true');

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  const initialCenter = await expect
    .poll(() => getMapCenter(page))
    .not.toBeUndefined()
    .then(async () => {
      const center = await getMapCenter(page);
      if (!center) {
        throw new Error('Map center is not available after map initialization.');
      }
      return center;
    });

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  const geocoderPanel = page.getByTestId('geocoder-panel');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  await expect.poll(async () => {
    const optionCount = await geocoderPanel.getByRole('option').count();
    const namedButtonCount = await geocoderPanel.getByRole('button', { name: /münster/i }).count();
    const listItemCount = await geocoderPanel.getByRole('listitem').count();
    const textCount = await geocoderPanel.getByText(/münster/i).count();
    return optionCount + namedButtonCount + listItemCount + textCount;
  }).toBeGreaterThan(0);

  let firstResult = geocoderPanel.getByRole('option').first();
  if ((await geocoderPanel.getByRole('option').count()) === 0) {
    const namedButtons = geocoderPanel.getByRole('button', { name: /münster/i });
    if ((await namedButtons.count()) > 0) {
      firstResult = namedButtons.first();
    } else {
      const listItems = geocoderPanel.getByRole('listitem');
      if ((await listItems.count()) > 0) {
        firstResult = listItems.first();
      } else {
        firstResult = geocoderPanel.getByText(/münster/i).first();
      }
    }
  }

  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect(geocoderInput).toHaveValue(/münster/i);

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    if (!center) {
      return 0;
    }
    const dx = center[0] - initialCenter[0];
    const dy = center[1] - initialCenter[1];
    return Math.hypot(dx, dy);
  }).toBeGreaterThan(50000);

  await expect.poll(async () => (await getHighlightedCoordinate(page)) !== undefined).toBe(true);

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    const highlight = await getHighlightedCoordinate(page);
    if (!center || !highlight) {
      return false;
    }
    return Math.hypot(center[0] - highlight[0], center[1] - highlight[1]) < 50000;
  }).toBe(true);

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => {
    return await weatherForecastSection.getByText('Click on the map to load a forecast.').count();
  }).toBe(0);

  await expect.poll(async () => {
    const listItemCount = await weatherForecastSection.getByRole('listitem').count();
    const articleCount = await weatherForecastSection.getByRole('article').count();
    const imageCount = await weatherForecastSection.getByRole('img').count();
    const rowCount = await weatherForecastSection.getByRole('row').count();

    const candidates = [
      listItemCount,
      articleCount,
      imageCount,
      rowCount,
      rowCount > 0 ? rowCount - 1 : 0
    ];

    return candidates.includes(24) ? 24 : Math.max(...candidates);
  }).toBe(24);
});
