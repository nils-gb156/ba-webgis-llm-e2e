// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const readToggleState = async (locator: import('@playwright/test').Locator): Promise<boolean> => {
    try {
      return await locator.isChecked();
    } catch {
      const ariaPressed = await locator.getAttribute('aria-pressed');
      if (ariaPressed !== null) {
        return ariaPressed === 'true';
      }

      const ariaSelected = await locator.getAttribute('aria-selected');
      if (ariaSelected !== null) {
        return ariaSelected === 'true';
      }

      throw new Error('Unable to determine toggle state from control.');
    }
  };

  const ensureToggleState = async (
    locator: import('@playwright/test').Locator,
    desiredState: boolean
  ): Promise<void> => {
    await expect(locator).toBeVisible();

    if ((await readToggleState(locator)) !== desiredState) {
      await locator.click({ force: true });
    }

    await expect.poll(() => readToggleState(locator)).toBe(desiredState);
  };

  const temperatureToggle = page.getByLabel(/^Temperature$/i)
    .or(page.getByRole('checkbox', { name: /^Temperature$/i }))
    .or(page.getByRole('switch', { name: /^Temperature$/i }))
    .or(page.getByRole('button', { name: /^Temperature$/i }))
    .first();

  const precipitationToggle = page.getByLabel(/^Precipitation$/i)
    .or(page.getByRole('checkbox', { name: /^Precipitation$/i }))
    .or(page.getByRole('switch', { name: /^Precipitation$/i }))
    .or(page.getByRole('button', { name: /^Precipitation$/i }))
    .first();

  const searchField = page.getByRole('combobox', { name: /search|suche|location|place/i })
    .or(page.getByRole('searchbox'))
    .or(page.getByRole('textbox', { name: /search|suche|location|place/i }))
    .or(page.getByRole('combobox').first())
    .or(page.getByRole('textbox').first())
    .first();

  const infoPanel = page.getByRole('complementary')
    .or(page.getByRole('region', { name: /info|weather|forecast/i }))
    .first();

  const measurementToolToggle = page.getByRole('button', { name: /measure|measurement/i }).first();

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();
  await expect.poll(() => readToggleState(temperatureToggle)).toBe(true);
  await expect.poll(() => readToggleState(precipitationToggle)).toBe(false);

  await expect(searchField).toBeVisible();

  if (await infoPanel.count()) {
    await expect(infoPanel).toBeVisible();
  }

  if (await measurementToolToggle.count()) {
    await expect.poll(async () => await measurementToolToggle.getAttribute('aria-pressed')).not.toBe('true');
  }

  await ensureToggleState(temperatureToggle, false);
  await ensureToggleState(precipitationToggle, true);

  await searchField.click();
  await searchField.fill('Münster');

  const firstSearchResult = page.getByRole('option').first()
    .or(page.getByRole('button', { name: /Münster/i }).first())
    .or(page.getByRole('listitem').filter({ hasText: /Münster/i }).first())
    .first();

  await expect(firstSearchResult).toBeVisible();
  const selectedResultText = ((await firstSearchResult.textContent()) ?? 'Münster').trim();

  const weatherRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/forecast|weather|meteo/i.test(url)) {
      weatherRequests.push(url);
    }
  });

  await firstSearchResult.click();

  await expect.poll(async () => await searchField.inputValue()).toMatch(/Münster/i);
  await expect.poll(() => weatherRequests.length).toBeGreaterThan(0);

  const forecastRegion = page.getByRole('region', { name: /weather forecast|forecast|wetter/i })
    .or(page.getByRole('group', { name: /weather forecast|forecast|wetter/i }))
    .first();

  const forecastSection = forecastRegion
    .or(page.getByRole('heading', { name: /weather forecast|forecast|wetter/i }))
    .or(page.getByText(/weather forecast|forecast|wetter/i))
    .first();

  await expect(forecastSection).toBeVisible();

  if (selectedResultText.length > 0) {
    await expect(searchField).toHaveValue(/Münster/i);
  }

  await expect.poll(async () => {
    const scope: any = (await forecastRegion.count()) > 0 ? forecastRegion : page;

    const listItemCount = await scope.getByRole('listitem').count();
    if (listItemCount === 24) {
      return 24;
    }

    const rowCount = await scope.getByRole('row').count();
    if (rowCount === 24) {
      return 24;
    }
    if (rowCount === 25) {
      return 24;
    }

    return await scope.getByText(/\b\d{1,2}:\d{2}\b/).count();
  }).toBe(24);
});
