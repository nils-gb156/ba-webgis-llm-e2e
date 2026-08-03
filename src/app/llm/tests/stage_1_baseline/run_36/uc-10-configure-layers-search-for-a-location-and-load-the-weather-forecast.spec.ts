// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const resolveExisting = async (candidates: any[]) => {
    for (const candidate of candidates) {
      const locator = candidate.first();
      if ((await locator.count()) > 0) {
        return locator;
      }
    }
    throw new Error('No matching locator found.');
  };

  const resolveVisible = async (candidates: any[], timeout = 10000) => {
    for (const candidate of candidates) {
      const locator = candidate.first();
      try {
        await expect(locator).toBeVisible({ timeout });
        return locator;
      } catch {
        // try next candidate
      }
    }
    throw new Error('No visible locator found.');
  };

  const getToggleState = async (toggle: any) => {
    const role = await toggle.getAttribute('role');
    const ariaPressed = await toggle.getAttribute('aria-pressed');
    const ariaChecked = await toggle.getAttribute('aria-checked');

    if (role === 'switch' || role === 'checkbox' || role === 'radio') {
      return await toggle.isChecked();
    }

    if (ariaPressed !== null) {
      return ariaPressed === 'true';
    }

    if (ariaChecked !== null) {
      return ariaChecked === 'true';
    }

    throw new Error('Unsupported toggle element.');
  };

  const setToggleState = async (toggle: any, desiredState: boolean) => {
    const currentState = await getToggleState(toggle);
    if (currentState !== desiredState) {
      const role = await toggle.getAttribute('role');
      if (role === 'switch' || role === 'checkbox' || role === 'radio') {
        await toggle.click({ force: true });
      } else {
        await toggle.click();
      }
    }

    await expect.poll(async () => await getToggleState(toggle)).toBe(desiredState);
  };

  const temperatureToggle = await resolveExisting([
    page.getByTestId('temperature-layer-toggle'),
    page.getByTestId('layer-toggle-temperature'),
    page.getByTestId('toggle-temperature'),
    page.getByRole('switch', { name: /^Temperature$/i }),
    page.getByRole('checkbox', { name: /^Temperature$/i }),
    page.getByLabel(/^Temperature$/i),
    page.getByRole('button', { name: /^Temperature$/i })
  ]);

  const precipitationToggle = await resolveExisting([
    page.getByTestId('precipitation-layer-toggle'),
    page.getByTestId('layer-toggle-precipitation'),
    page.getByTestId('toggle-precipitation'),
    page.getByRole('switch', { name: /^Precipitation$/i }),
    page.getByRole('checkbox', { name: /^Precipitation$/i }),
    page.getByLabel(/^Precipitation$/i),
    page.getByRole('button', { name: /^Precipitation$/i })
  ]);

  await expect.poll(async () => await getToggleState(temperatureToggle)).toBe(true);
  await expect.poll(async () => await getToggleState(precipitationToggle)).toBe(false);

  await setToggleState(temperatureToggle, false);
  await setToggleState(precipitationToggle, true);

  await expect.poll(async () => await getToggleState(temperatureToggle)).toBe(false);
  await expect.poll(async () => await getToggleState(precipitationToggle)).toBe(true);

  const searchField = await resolveVisible([
    page.getByTestId('geocoder-input'),
    page.getByTestId('search-input'),
    page.getByRole('combobox', { name: /^Search$/i }),
    page.getByRole('combobox', { name: /^Search Address$/i }),
    page.getByRole('textbox', { name: /^Search$/i }),
    page.getByRole('searchbox'),
    page.getByRole('combobox'),
    page.getByRole('textbox')
  ]);

  await searchField.click();
  await searchField.fill('Münster');

  const firstResult = await resolveVisible([
    page.getByRole('listbox').getByRole('option'),
    page.getByRole('option'),
    page.getByRole('listbox').getByRole('button'),
    page.getByRole('button', { name: /Münster/i }),
    page.getByRole('listitem').filter({ hasText: /Münster/i }),
    page.getByText(/Münster/i)
  ], 15000);

  await firstResult.click();

  const forecastHeading = await resolveVisible([
    page.getByRole('heading', { name: /^Weather forecast$/i }),
    page.getByRole('heading', { name: /^Forecast$/i }),
    page.getByText(/^Weather forecast$/i),
    page.getByText(/^Forecast$/i)
  ], 20000);

  const forecastContainer = await resolveExisting([
    page.getByTestId('weather-forecast'),
    page.getByRole('region', { name: /^Weather forecast$/i }),
    page.getByRole('group', { name: /^Weather forecast$/i }),
    page.getByRole('complementary').filter({ has: forecastHeading }),
    page.getByRole('region').filter({ has: forecastHeading }),
    page.getByRole('group').filter({ has: forecastHeading }),
    page.locator('aside').filter({ has: forecastHeading }),
    page.locator('section').filter({ has: forecastHeading })
  ]);

  await expect(forecastHeading).toBeVisible();

  await expect.poll(async () => {
    const listItems = await forecastContainer.getByRole('listitem').count();
    if (listItems > 0) {
      return listItems;
    }

    const articles = await forecastContainer.getByRole('article').count();
    if (articles > 0) {
      return articles;
    }

    const rows = await forecastContainer.getByRole('row').count();
    if (rows > 1) {
      return rows - 1;
    }

    return 0;
  }, { timeout: 20000 }).toBe(24);
});
