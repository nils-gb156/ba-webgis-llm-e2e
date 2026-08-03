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

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(0);
  await expect.poll(async () => (await getMapCenter(page))?.length).toBe(2);

  const measurementToggle = page.getByTestId('measurement-toggle');
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

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

  const centerBeforeSearch = (await getMapCenter(page)) as [number, number];

  let geocoderInput = page.getByTestId('geocoder-input');
  const geocoderInputIsEditable = await geocoderInput
    .evaluate(
      (element) => element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
    )
    .catch(() => false);
  if (!geocoderInputIsEditable) {
    geocoderInput = page.getByRole('textbox', { name: 'Geocoder search', exact: true });
  }

  await expect(geocoderInput).toBeVisible();
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  await expect.poll(async () => {
    const scopedOptionCount = await geocoderPanel.getByRole('option').count();
    const scopedButtonCount = await geocoderPanel.getByRole('button').count();
    const globalOptionCount = await page.getByRole('option').count();
    return Math.max(scopedOptionCount + scopedButtonCount, globalOptionCount);
  }).toBeGreaterThan(0);

  const scopedOptionCount = await geocoderPanel.getByRole('option').count();
  const scopedButtonCount = await geocoderPanel.getByRole('button').count();

  const firstResult =
    scopedOptionCount > 0
      ? geocoderPanel.getByRole('option').first()
      : scopedButtonCount > 0
        ? geocoderPanel.getByRole('button').first()
        : page.getByRole('option').first();

  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    return center ? JSON.stringify(center) : undefined;
  }).not.toBe(JSON.stringify(centerBeforeSearch));

  await expect.poll(async () => (await getHighlightedCoordinate(page))?.length).toBe(2);

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

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

      const directChildren = Array.from(section.children);
      if (directChildren.length === 1) {
        const grandChildrenCount = directChildren[0].children.length;
        if (grandChildrenCount > 0) {
          return grandChildrenCount;
        }
      }

      return directChildren.length;
    });
  }).toBe(24);
});
