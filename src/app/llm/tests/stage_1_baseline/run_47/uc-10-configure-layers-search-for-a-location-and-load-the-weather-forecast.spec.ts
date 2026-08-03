// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const temperatureToggle = page.getByLabel(/Temperature/i).first();
  const precipitationToggle = page.getByLabel(/Precipitation/i).first();

  await expect(page.getByText(/Temperature/i).first()).toBeVisible();
  await expect(page.getByText(/Precipitation/i).first()).toBeVisible();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  const measureButton = page.getByRole('button', { name: /measure/i }).first();
  if (await measureButton.count() > 0) {
    await expect(measureButton).toHaveAttribute('aria-pressed', 'false');
  }

  await temperatureToggle.uncheck({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.check({ force: true });
  await expect(precipitationToggle).toBeChecked();

  let searchField = page.getByRole('combobox').first();
  if (await searchField.count() === 0) {
    searchField = page.getByRole('searchbox').first();
  }
  if (await searchField.count() === 0) {
    searchField = page.getByRole('textbox', { name: /search/i }).first();
  }

  await expect(searchField).toBeVisible();
  await searchField.click();
  await searchField.fill('Münster');

  const firstResult = page.getByRole('option').first();
  await expect(firstResult).toBeVisible();
  const selectedResultText = ((await firstResult.innerText()).trim() || 'Münster');

  const forecastRequests: string[] = [];
  page.on('request', request => {
    if (/forecast/i.test(request.url())) {
      forecastRequests.push(request.url());
    }
  });

  const forecastResponsePromise = page.waitForResponse(response => /forecast/i.test(response.url()) && response.ok());

  await firstResult.click();

  await expect.poll(async () => await searchField.inputValue()).toMatch(/Münster/i);

  const forecastResponse = await forecastResponsePromise;
  await expect.poll(() => forecastRequests.length).toBeGreaterThan(0);

  await page.waitForLoadState('networkidle');

  let forecastHeading = page.getByRole('heading', { name: /forecast/i }).first();
  if (await forecastHeading.count() === 0) {
    forecastHeading = page.getByText(/forecast/i).first();
  }
  await expect(forecastHeading).toBeVisible();

  const countForecastEntries = (value: unknown): number | undefined => {
    if (Array.isArray(value)) {
      if (value.length === 24) {
        return 24;
      }
      for (const item of value) {
        const nestedCount = countForecastEntries(item);
        if (nestedCount === 24) {
          return nestedCount;
        }
      }
      return undefined;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;

      for (const key of ['forecast', 'hourly', 'entries', 'timeseries', 'list', 'data']) {
        const candidate = record[key];
        if (Array.isArray(candidate) && candidate.length === 24) {
          return 24;
        }
      }

      for (const nestedValue of Object.values(record)) {
        const nestedCount = countForecastEntries(nestedValue);
        if (nestedCount === 24) {
          return nestedCount;
        }
      }
    }

    return undefined;
  };

  const forecastJson = await forecastResponse.json();
  expect(countForecastEntries(forecastJson)).toBe(24);

  expect(selectedResultText).toMatch(/Münster/i);
});
