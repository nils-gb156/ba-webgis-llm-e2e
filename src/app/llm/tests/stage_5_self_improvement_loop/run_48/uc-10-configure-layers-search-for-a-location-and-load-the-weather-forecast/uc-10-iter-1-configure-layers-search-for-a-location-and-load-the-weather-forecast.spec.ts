// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  if (!(await layerSwitcher.isVisible())) {
    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
      await layerSwitcherToggle.click();
    }
  }
  await expect(layerSwitcher).toBeVisible();

  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  if (!(await infoPanel.isVisible())) {
    if ((await infoPanelToggle.getAttribute('aria-pressed')) !== 'true') {
      await infoPanelToggle.click();
    }
  }
  await expect(infoPanel).toBeVisible();

  const measurementToggle = page.getByTestId('measurement-toggle');
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);
  await expect.poll(async () => (await getMapCenter(page))?.length).toBe(2);

  const centerBeforeSearch = await getMapCenter(page);
  if (!centerBeforeSearch) {
    throw new Error('Map center was not available before starting the search.');
  }

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderInput).toBeVisible();
  await expect(geocoderPanel).toBeVisible();

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const searchResultName = /Münster|Munster/i;
  await expect.poll(async () => {
    const optionCount = await page.getByRole('option', { name: searchResultName }).count();
    const buttonCount = await page.getByRole('button', { name: searchResultName }).count();
    const textCount = await page.getByText(searchResultName).count();
    return optionCount + buttonCount + textCount;
  }).toBeGreaterThan(0);

  const matchingOption = page.getByRole('option', { name: searchResultName }).first();
  const matchingButton = page.getByRole('button', { name: searchResultName }).first();

  if (await matchingOption.count()) {
    await matchingOption.click();
  } else if (await matchingButton.count()) {
    await matchingButton.click();
  } else {
    await page.getByText(searchResultName).first().click();
  }

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    if (!center) {
      return 0;
    }
    return Math.hypot(center[0] - centerBeforeSearch[0], center[1] - centerBeforeSearch[1]);
  }).toBeGreaterThan(100000);

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    const highlight = await getHighlightedCoordinate(page);
    if (!center || !highlight) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.hypot(center[0] - highlight[0], center[1] - highlight[1]);
  }).toBeLessThan(50000);

  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.floor(mapBox.width / 2),
      y: Math.floor(mapBox.height / 2)
    }
  });

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate((section) => {
      const liCount = section.querySelectorAll('li').length;
      if (liCount > 0) {
        return liCount;
      }

      const roleListItemCount = section.querySelectorAll('[role="listitem"]').length;
      if (roleListItemCount > 0) {
        return roleListItemCount;
      }

      const candidates = [section, ...Array.from(section.querySelectorAll('*'))];
      const childCounts = candidates.map((element) => element.children.length).filter((count) => count > 1);
      return childCounts.length > 0 ? Math.max(...childCounts) : section.children.length;
    });
  }).toBe(24);
});
