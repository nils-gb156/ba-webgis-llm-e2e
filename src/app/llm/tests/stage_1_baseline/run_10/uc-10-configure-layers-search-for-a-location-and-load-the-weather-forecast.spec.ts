// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const locateLayerToggle = async (name: string) => {
    const looseName = new RegExp(`\\b${escapeForRegExp(name)}\\b`, 'i');
    const candidates = [
      { locator: page.getByRole('checkbox', { name, exact: true }).first(), mode: 'checked' as const },
      { locator: page.getByRole('switch', { name, exact: true }).first(), mode: 'checked' as const },
      { locator: page.getByRole('checkbox', { name: looseName }).first(), mode: 'checked' as const },
      { locator: page.getByRole('switch', { name: looseName }).first(), mode: 'checked' as const },
      { locator: page.getByRole('button', { name, exact: true }).first(), mode: 'pressed' as const },
      { locator: page.getByRole('button', { name: looseName }).first(), mode: 'pressed' as const }
    ];

    for (const candidate of candidates) {
      if ((await candidate.locator.count()) > 0) {
        return candidate;
      }
    }

    throw new Error(`Could not find a visibility toggle for layer "${name}".`);
  };

  const readToggleState = async (toggle: { locator: any; mode: 'checked' | 'pressed' }) => {
    if (toggle.mode === 'checked') {
      return await toggle.locator.isChecked();
    }

    const ariaPressed = await toggle.locator.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      return ariaPressed === 'true';
    }

    const ariaChecked = await toggle.locator.getAttribute('aria-checked');
    if (ariaChecked !== null) {
      return ariaChecked === 'true';
    }

    throw new Error('Pressed-state toggle has neither aria-pressed nor aria-checked.');
  };

  const ensureToggleState = async (toggle: { locator: any; mode: 'checked' | 'pressed' }, expected: boolean) => {
    await expect(toggle.locator).toBeVisible();

    if ((await readToggleState(toggle)) !== expected) {
      if (toggle.mode === 'checked') {
        await toggle.locator.click({ force: true });
      } else {
        await toggle.locator.click();
      }
    }

    await expect.poll(async () => readToggleState(toggle)).toBe(expected);
  };

  const locateSearchField = async () => {
    const candidates = [
      page.getByRole('combobox', { name: /search|place|location|address/i }).first(),
      page.getByRole('searchbox').first(),
      page.getByRole('textbox', { name: /search|place|location|address/i }).first(),
      page.getByPlaceholder(/search|place|location|address/i).first(),
      page.getByRole('combobox').first(),
      page.getByRole('textbox').first()
    ];

    for (const candidate of candidates) {
      if ((await candidate.count()) > 0) {
        return candidate;
      }
    }

    throw new Error('Could not find the geocoder search field.');
  };

  const extractForecastEntryCount = (value: any): number | undefined => {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const directCandidates = [
      value.forecast,
      value.forecasts,
      value.entries,
      value.items,
      value.list,
      value.hourly,
      value.timeseries,
      value.data,
      value.properties?.timeseries,
      value.properties?.forecast,
      value.properties?.hourly
    ];

    for (const candidate of directCandidates) {
      if (Array.isArray(candidate)) {
        return candidate.length;
      }
    }

    return undefined;
  };

  const hasWeatherSignal = (value: any): boolean => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const keys = Object.keys(value);
    if (keys.some((key) => /weather|forecast|temperature|precipitation|timeseries|hourly/i.test(key))) {
      return true;
    }

    for (const nestedKey of ['properties', 'data', 'forecast', 'hourly']) {
      const nestedValue = value[nestedKey];
      if (nestedValue && typeof nestedValue === 'object' && hasWeatherSignal(nestedValue)) {
        return true;
      }
    }

    return false;
  };

  const observedForecastResponses: Array<{ url: string; count: number }> = [];
  page.on('response', async (response) => {
    try {
      if (!response.ok()) {
        return;
      }

      const contentType = response.headers()['content-type'] ?? '';
      if (!contentType.includes('json')) {
        return;
      }

      const json = await response.json();
      const count = extractForecastEntryCount(json);

      if (
        count !== undefined &&
        (hasWeatherSignal(json) || /weather|forecast|metno|open-meteo/i.test(response.url()))
      ) {
        observedForecastResponses.push({ url: response.url(), count });
      }
    } catch {
      // Ignore non-JSON or otherwise unreadable responses.
    }
  });

  const temperatureToggle = await locateLayerToggle('Temperature');
  const precipitationToggle = await locateLayerToggle('Precipitation');

  await expect(temperatureToggle.locator).toBeVisible();
  await expect(precipitationToggle.locator).toBeVisible();

  await expect.poll(async () => readToggleState(temperatureToggle)).toBe(true);
  await expect.poll(async () => readToggleState(precipitationToggle)).toBe(false);

  const measurementToggle = page.getByRole('button', { name: /measure/i }).first();
  if ((await measurementToggle.count()) > 0) {
    const ariaPressed = await measurementToggle.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      expect(ariaPressed).toBe('false');
    }
  }

  await ensureToggleState(temperatureToggle, false);
  await ensureToggleState(precipitationToggle, true);

  const searchField = await locateSearchField();
  await expect(searchField).toBeVisible();
  await searchField.click();
  await searchField.fill('Münster');

  await expect.poll(async () => {
    const optionCount = await page.getByRole('option').count();
    const exactButtonCount = await page.getByRole('button', { name: /Münster/i }).count();
    const listItemCount = await page.getByRole('listitem').filter({ has: page.getByText(/Münster/i) }).count();
    return optionCount + exactButtonCount + listItemCount;
  }).toBeGreaterThan(0);

  const resultCandidates = [
    page.getByRole('option', { name: /Münster/i }).first(),
    page.getByRole('button', { name: /Münster/i }).first(),
    page.getByRole('listitem').filter({ has: page.getByText(/Münster/i) }).first(),
    page.getByRole('option').first()
  ];

  let firstResult: any = null;
  for (const candidate of resultCandidates) {
    if ((await candidate.count()) > 0) {
      firstResult = candidate;
      break;
    }
  }

  if (!firstResult) {
    throw new Error('Could not find a selectable geocoder result.');
  }

  await expect(firstResult).toBeVisible();
  const selectedResultText = ((await firstResult.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  await firstResult.click();

  if (selectedResultText) {
    const normalizedSelectedLabel = selectedResultText.split(',')[0]?.trim() ?? selectedResultText;
    if (normalizedSelectedLabel) {
      await expect.poll(async () => {
        const value = await searchField.inputValue();
        return value.replace(/\s+/g, ' ').trim();
      }).toContain(normalizedSelectedLabel);
    }
  }

  const forecastHeading = page.getByRole('heading', { name: /weather forecast|forecast/i }).first();
  await expect(forecastHeading).toBeVisible();

  await expect.poll(() => observedForecastResponses.some((response) => response.count === 24)).toBe(true);

  const forecastRegion = page.getByRole('region', { name: /weather forecast|forecast/i }).first();
  if ((await forecastRegion.count()) > 0) {
    await expect(forecastRegion).toBeVisible();

    await expect.poll(async () => {
      const listItems = await forecastRegion.getByRole('listitem').count();
      if (listItems > 0) {
        return listItems;
      }

      const articles = await forecastRegion.getByRole('article').count();
      if (articles > 0) {
        return articles;
      }

      const rows = await forecastRegion.getByRole('row').count();
      if (rows > 1) {
        return rows - 1;
      }

      return 0;
    }).toBe(24);
  }

  await expect.poll(async () => readToggleState(temperatureToggle)).toBe(false);
  await expect.poll(async () => readToggleState(precipitationToggle)).toBe(true);
});
