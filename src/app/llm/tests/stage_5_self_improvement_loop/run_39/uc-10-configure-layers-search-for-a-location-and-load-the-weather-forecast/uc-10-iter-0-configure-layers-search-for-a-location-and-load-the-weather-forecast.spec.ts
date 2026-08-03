// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const layerSwitcher = page.getByTestId('layer-switcher');
  const geocoderPanel = page.getByTestId('geocoder-panel');
  const geocoderInput = page.getByTestId('geocoder-input');
  const infoPanel = page.getByTestId('info-panel');
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(layerSwitcher).toBeVisible();
  await expect(geocoderPanel).toBeVisible();
  await expect(geocoderInput).toBeVisible();
  await expect(infoPanel).toBeVisible();
  await expect(measurementToggle).not.toHaveAttribute('aria-pressed', 'true');

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  await expect(temperatureCheckbox).toBeChecked();
  await expect(precipitationCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false);

  await expect.poll(() => getMapCenter(page)).not.toBeUndefined();
  const initialCenter = await getMapCenter(page);
  if (!initialCenter) {
    throw new Error('Map center was not available after the map became ready.');
  }

  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  const optionResult = page.getByRole('option', { name: /Münster/i }).first();
  const buttonResult = page.getByRole('button', { name: /Münster/i }).first();
  const listItemResult = page.getByRole('listitem').filter({ hasText: /Münster/i }).first();

  await expect
    .poll(async () => {
      if ((await optionResult.count()) > 0) return 'option';
      if ((await buttonResult.count()) > 0) return 'button';
      if ((await listItemResult.count()) > 0) return 'listitem';
      return 'none';
    })
    .not.toBe('none');

  let firstSearchResult = optionResult;
  if ((await optionResult.count()) > 0) {
    firstSearchResult = optionResult;
  } else if ((await buttonResult.count()) > 0) {
    firstSearchResult = buttonResult;
  } else {
    firstSearchResult = listItemResult;
  }

  await expect(firstSearchResult).toBeVisible();
  await firstSearchResult.click();

  await expect.poll(async () => {
    const currentCenter = await getMapCenter(page);
    if (!currentCenter) {
      return 0;
    }

    const dx = currentCenter[0] - initialCenter[0];
    const dy = currentCenter[1] - initialCenter[1];
    return Math.hypot(dx, dy);
  }).toBeGreaterThan(1000);

  await expect(infoPanel).toBeVisible();
  await expect(weatherForecastSection).toBeVisible();

  await expect.poll(async () => {
    const listItems = await weatherForecastSection.getByRole('listitem').count();
    if (listItems > 0) {
      return listItems;
    }

    const rows = await weatherForecastSection.getByRole('row').count();
    if (rows > 1) {
      return rows - 1;
    }

    const articles = await weatherForecastSection.getByRole('article').count();
    if (articles > 0) {
      return articles;
    }

    const maxChildCount = await weatherForecastSection.evaluate((section) => {
      const stack: Element[] = [section];
      let max = 0;

      while (stack.length > 0) {
        const current = stack.pop();
        if (!current) {
          continue;
        }

        max = Math.max(max, current.childElementCount);
        for (const child of Array.from(current.children)) {
          stack.push(child);
        }
      }

      return max;
    });

    return maxChildCount;
  }).toBe(24);
});
