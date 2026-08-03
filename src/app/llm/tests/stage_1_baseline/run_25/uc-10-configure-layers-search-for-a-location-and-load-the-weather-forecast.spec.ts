// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const findLayerControl = async (layerName: string) => {
    const name = new RegExp(`\\b${escapeRegExp(layerName)}\\b`, 'i');

    const checkbox = page.getByRole('checkbox', { name });
    if ((await checkbox.count()) > 0) {
      return { locator: checkbox.first(), kind: 'checkbox' as const };
    }

    const switchControl = page.getByRole('switch', { name });
    if ((await switchControl.count()) > 0) {
      return { locator: switchControl.first(), kind: 'switch' as const };
    }

    const button = page.getByRole('button', { name });
    if ((await button.count()) > 0) {
      return { locator: button.first(), kind: 'button' as const };
    }

    throw new Error(`No layer visibility control found for "${layerName}".`);
  };

  const assertLayerVisibilityState = async (
    control: { locator: ReturnType<typeof page.locator>; kind: 'checkbox' | 'switch' | 'button' },
    visible: boolean
  ) => {
    if (control.kind === 'button') {
      await expect(control.locator).toHaveAttribute('aria-pressed', visible ? 'true' : 'false');
      return;
    }

    if (visible) {
      await expect(control.locator).toBeChecked();
    } else {
      await expect(control.locator).not.toBeChecked();
    }
  };

  const toggleLayerControl = async (
    control: { locator: ReturnType<typeof page.locator>; kind: 'checkbox' | 'switch' | 'button' }
  ) => {
    if (control.kind === 'button') {
      await control.locator.click();
    } else {
      await control.locator.click({ force: true });
    }
  };

  await expect(page.getByText('Temperature', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Precipitation', { exact: true }).first()).toBeVisible();

  const temperatureControl = await findLayerControl('Temperature');
  const precipitationControl = await findLayerControl('Precipitation');

  await assertLayerVisibilityState(temperatureControl, true);
  await assertLayerVisibilityState(precipitationControl, false);

  await toggleLayerControl(temperatureControl);
  await assertLayerVisibilityState(temperatureControl, false);

  await toggleLayerControl(precipitationControl);
  await assertLayerVisibilityState(precipitationControl, true);

  let searchField = page.getByRole('combobox');
  if ((await searchField.count()) === 0) {
    searchField = page.getByRole('searchbox');
  }
  if ((await searchField.count()) === 0) {
    searchField = page.getByRole('textbox', { name: /search/i });
  }
  searchField = searchField.first();

  await expect(searchField).toBeVisible();
  await searchField.click();
  await searchField.fill('Münster');

  let firstResult = page.getByRole('option').first();
  if ((await page.getByRole('option').count()) === 0) {
    const buttonResults = page.getByRole('button').filter({ hasText: /Münster/i });
    if ((await buttonResults.count()) > 0) {
      firstResult = buttonResults.first();
    } else {
      firstResult = page.getByText(/Münster/i).first();
    }
  }

  await expect(firstResult).toBeVisible();
  const selectedResultText = ((await firstResult.textContent()) ?? 'Münster').trim();

  const forecastRequests: string[] = [];
  page.on('request', request => {
    if (/forecast/i.test(request.url())) {
      forecastRequests.push(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse(response => /forecast/i.test(response.url()) && response.ok());

  await firstResult.click();

  await expect.poll(() => forecastRequests.length).toBeGreaterThan(0);

  await expect.poll(async () => {
    try {
      return await searchField.inputValue();
    } catch {
      return selectedResultText;
    }
  }).toContain('Münster');

  const forecastResponse = await forecastResponsePromise;
  const forecastData = await forecastResponse.json();

  const findForecastEntryCount = (value: unknown): number | undefined => {
    if (Array.isArray(value)) {
      return value.length === 24 ? 24 : undefined;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;

      for (const key of ['entries', 'forecast', 'data', 'hourly', 'time', 'times']) {
        if (key in record) {
          const nestedCount = findForecastEntryCount(record[key]);
          if (nestedCount === 24) {
            return 24;
          }
        }
      }

      for (const nested of Object.values(record)) {
        const nestedCount = findForecastEntryCount(nested);
        if (nestedCount === 24) {
          return 24;
        }
      }
    }

    return undefined;
  };

  const responseForecastEntryCount = findForecastEntryCount(forecastData) ?? 0;
  expect(responseForecastEntryCount).toBe(24);

  let infoPanel = page.getByRole('complementary');
  if ((await infoPanel.count()) === 0) {
    infoPanel = page.getByRole('region', { name: /info|forecast/i });
  }
  const infoPanelContainer = (await infoPanel.count()) > 0 ? infoPanel.first() : page.locator('body');

  await expect(infoPanelContainer).toBeVisible();

  const forecastHeading = infoPanelContainer.getByRole('heading', { name: /forecast/i });
  if ((await forecastHeading.count()) > 0) {
    await expect(forecastHeading.first()).toBeVisible();
  } else {
    await expect(infoPanelContainer.getByText(/forecast/i).first()).toBeVisible();
  }
});
