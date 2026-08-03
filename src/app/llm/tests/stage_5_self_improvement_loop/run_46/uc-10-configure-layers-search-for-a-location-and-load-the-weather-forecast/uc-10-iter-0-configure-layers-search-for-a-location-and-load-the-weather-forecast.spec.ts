// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import {
  getActiveBaseLayerTitle,
  getMapCenter,
  isLayerRendered
} from '../../../../map-model-helpers';

test('UC10 - Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const searchInput = geocoderPanel.getByRole('textbox', { name: 'Geocoder search', exact: true });
  const temperatureCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(infoPanel).toBeVisible();
  await expect(infoPanelToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(searchInput).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();

  const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (measurementPressed !== null) {
    expect(measurementPressed).toBe('false');
  }

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    return Array.isArray(center) ? center.length : 0;
  }).toBe(2);
  const initialCenter = (await getMapCenter(page))!;

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  await searchInput.click();
  await searchInput.fill('Münster');

  const optionResults = page.getByRole('option', { name: /Münster/i });
  const buttonResults = page.getByRole('button', { name: /Münster/i });
  const linkResults = page.getByRole('link', { name: /Münster/i });
  const listItemResults = page.getByRole('listitem').filter({ hasText: /Münster/i });

  const detectResultKind = async (): Promise<'option' | 'button' | 'link' | 'listitem' | ''> => {
    if ((await optionResults.count()) > 0 && await optionResults.first().isVisible()) {
      return 'option';
    }
    if ((await buttonResults.count()) > 0 && await buttonResults.first().isVisible()) {
      return 'button';
    }
    if ((await linkResults.count()) > 0 && await linkResults.first().isVisible()) {
      return 'link';
    }
    if ((await listItemResults.count()) > 0 && await listItemResults.first().isVisible()) {
      return 'listitem';
    }
    return '';
  };

  await expect.poll(detectResultKind).toMatch(/^(option|button|link|listitem)$/);

  const resultKind = await detectResultKind();
  const firstResult =
    resultKind === 'option'
      ? optionResults.first()
      : resultKind === 'button'
        ? buttonResults.first()
        : resultKind === 'link'
          ? linkResults.first()
          : listItemResults.first();

  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect(searchInput).toHaveValue(/Münster/i);

  await expect.poll(async () => {
    const center = await getMapCenter(page);
    if (!center) {
      return 0;
    }
    return Math.hypot(center[0] - initialCenter[0], center[1] - initialCenter[1]);
  }).toBeGreaterThan(100000);

  await expect(weatherForecastSection).toBeVisible();
  await expect(weatherForecastSection).not.toContainText('Click on the map to load a forecast.');

  await expect.poll(async () => {
    return await weatherForecastSection.evaluate((section) => {
      const explicitCounts = [
        section.querySelectorAll('[role="listitem"]').length,
        section.querySelectorAll('li').length,
        section.querySelectorAll('[role="row"]').length,
        section.querySelectorAll('tr').length,
        section.querySelectorAll('article').length
      ];

      const containers = [section, ...Array.from(section.querySelectorAll<HTMLElement>('*'))];
      const containerChildCounts = containers.map((element) => {
        return Array.from(element.children).filter((child) => {
          const childElement = child as HTMLElement;
          const style = window.getComputedStyle(childElement);
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            childElement.innerText.trim().length > 0
          );
        }).length;
      });

      const allCounts = [...explicitCounts, ...containerChildCounts];
      return allCounts.includes(24) ? 24 : 0;
    });
  }).toBe(24);

  await expect(precipitationCheckbox).toBeChecked();
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
});
