// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const firstExistingLocator = async (candidates: Array<ReturnType<typeof page.getByRole> | ReturnType<typeof page.getByLabel> | ReturnType<typeof page.getByPlaceholder> | ReturnType<typeof page.getByText>>) => {
    for (const candidate of candidates) {
      if ((await candidate.count()) > 0) {
        return candidate.first();
      }
    }
    throw new Error('No matching locator found.');
  };

  const getLayerToggle = async (name: string) => {
    return await firstExistingLocator([
      page.getByRole('switch', { name, exact: true }),
      page.getByRole('checkbox', { name, exact: true }),
      page.getByLabel(name, { exact: true }),
      page.getByRole('button', { name: new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i') })
    ]);
  };

  const assertToggleState = async (locator: Awaited<ReturnType<typeof getLayerToggle>>, enabled: boolean) => {
    const role = await locator.getAttribute('role');
    if (role === 'button') {
      await expect(locator).toHaveAttribute('aria-pressed', enabled ? 'true' : 'false');
      return;
    }

    if (enabled) {
      await expect(locator).toBeChecked();
    } else {
      await expect(locator).not.toBeChecked();
    }
  };

  const setToggleState = async (locator: Awaited<ReturnType<typeof getLayerToggle>>, enabled: boolean) => {
    const role = await locator.getAttribute('role');

    if (role === 'button') {
      const isPressed = (await locator.getAttribute('aria-pressed')) === 'true';
      if (isPressed !== enabled) {
        await locator.click();
      }
      await expect(locator).toHaveAttribute('aria-pressed', enabled ? 'true' : 'false');
      return;
    }

    const isChecked = await locator.isChecked();
    if (isChecked !== enabled) {
      await locator.click({ force: true });
    }

    await assertToggleState(locator, enabled);
  };

  const searchField = await firstExistingLocator([
    page.getByRole('combobox', { name: /search/i }),
    page.getByRole('searchbox', { name: /search/i }),
    page.getByRole('textbox', { name: /search/i }),
    page.getByLabel(/search/i),
    page.getByPlaceholder(/search|location|place/i),
    page.getByRole('combobox'),
    page.getByRole('searchbox'),
    page.getByRole('textbox')
  ]);

  const infoPanelCandidates = [
    page.getByRole('complementary'),
    page.getByRole('region', { name: /info|weather|forecast/i })
  ];
  let infoPanel: ReturnType<typeof page.getByRole> | undefined;
  for (const candidate of infoPanelCandidates) {
    if ((await candidate.count()) > 0) {
      infoPanel = candidate.first();
      break;
    }
  }

  const temperatureToggle = await getLayerToggle('Temperature');
  const precipitationToggle = await getLayerToggle('Precipitation');

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();
  await expect(searchField).toBeVisible();
  if (infoPanel) {
    await expect(infoPanel).toBeVisible();
  }

  await assertToggleState(temperatureToggle, true);
  await assertToggleState(precipitationToggle, false);

  await setToggleState(temperatureToggle, false);
  await setToggleState(precipitationToggle, true);

  await searchField.click();
  await searchField.fill('Münster');

  await expect.poll(async () => {
    const optionCount = await page.getByRole('option').count();
    const buttonCount = await page.getByRole('button', { name: /münster/i }).count();
    const linkCount = await page.getByRole('link', { name: /münster/i }).count();
    return optionCount + buttonCount + linkCount;
  }).toBeGreaterThan(0);

  let firstResult;
  if ((await page.getByRole('option').count()) > 0) {
    firstResult = page.getByRole('option').first();
  } else if ((await page.getByRole('button', { name: /münster/i }).count()) > 0) {
    firstResult = page.getByRole('button', { name: /münster/i }).first();
  } else {
    firstResult = page.getByRole('link', { name: /münster/i }).first();
  }

  await expect(firstResult).toBeVisible();

  const forecastResponsePromise = page.waitForResponse(async (response) => {
    if (!response.ok()) {
      return false;
    }

    const contentType = response.headers()['content-type']?.toLowerCase() ?? '';
    if (!contentType.includes('application/json')) {
      return false;
    }

    const extractForecastCount = (value: unknown): number | undefined => {
      if (Array.isArray(value)) {
        if (value.length === 24) {
          return 24;
        }

        for (const item of value) {
          const nested = extractForecastCount(item);
          if (nested !== undefined) {
            return nested;
          }
        }
        return undefined;
      }

      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;

        for (const [key, nestedValue] of Object.entries(record)) {
          if (/forecast|hourly|entries|timeseries/i.test(key) && Array.isArray(nestedValue) && nestedValue.length === 24) {
            return 24;
          }
        }

        for (const nestedValue of Object.values(record)) {
          const nested = extractForecastCount(nestedValue);
          if (nested !== undefined) {
            return nested;
          }
        }
      }

      return undefined;
    };

    try {
      const body = await response.json();
      return extractForecastCount(body) === 24;
    } catch {
      return false;
    }
  });

  await Promise.all([forecastResponsePromise, firstResult.click()]);

  await expect(searchField).toHaveValue(/Münster/i);

  const forecastHeadingCandidates = [
    page.getByRole('heading', { name: /weather forecast/i }),
    page.getByRole('heading', { name: /forecast/i }),
    page.getByText(/weather forecast/i),
    page.getByText(/^forecast$/i)
  ];

  let forecastHeading;
  for (const candidate of forecastHeadingCandidates) {
    if ((await candidate.count()) > 0) {
      forecastHeading = candidate.first();
      break;
    }
  }

  if (forecastHeading) {
    await expect(forecastHeading).toBeVisible();
  }

  await expect.poll(async () => {
    const lists = page.getByRole('list');
    const listCount = await lists.count();
    for (let i = 0; i < listCount; i++) {
      const itemCount = await lists.nth(i).getByRole('listitem').count();
      if (itemCount === 24) {
        return 24;
      }
    }

    const tables = page.getByRole('table');
    const tableCount = await tables.count();
    for (let i = 0; i < tableCount; i++) {
      const rowCount = await tables.nth(i).getByRole('row').count();
      if (rowCount === 24) {
        return 24;
      }
    }

    return 0;
  }).toBe(24);

  await assertToggleState(temperatureToggle, false);
  await assertToggleState(precipitationToggle, true);
});
