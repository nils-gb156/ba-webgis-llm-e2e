// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import {
  getActiveBaseLayerTitle,
  getHighlightedCoordinate,
  getMapCenter,
  isLayerRendered
} from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
    await layerSwitcherToggle.click();
  }
  await expect(layerSwitcher).toBeVisible();

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
    await infoPanelToggle.click();
  }
  await expect(infoPanel).toBeVisible();

  const measurementToggle = page.getByTestId('measurement-toggle');
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  await expect(page.getByTestId('geocoder-panel')).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapCenter(page)).toHaveLength(2);

  const initialCenter = await getMapCenter(page);
  if (!initialCenter) {
    throw new Error('Map center is not available.');
  }

  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

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

  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  await expect(geocoderInput).toBeVisible();
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const firstSearchResult = page
    .locator('[role="option"], [role="listbox"] button, [role="listbox"] a')
    .first();
  await expect(firstSearchResult).toBeVisible();
  await firstSearchResult.click();

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    if (!center) {
      return 0;
    }
    return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
  }).toBeGreaterThan(5000);

  await expect.poll(() => getHighlightedCoordinate(page)).toHaveLength(2);

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate((element) => {
      const count = (selector: string) => element.querySelectorAll(selector).length;
      const rowCount = count('[role="row"]');
      const candidates = [
        count('[role="listitem"]'),
        count('[role="button"]'),
        rowCount,
        Math.max(rowCount - 1, 0),
        element.children.length
      ];
      return candidates.find((value) => value === 24) ?? Math.max(...candidates);
    });
  }).toBe(24);
});
