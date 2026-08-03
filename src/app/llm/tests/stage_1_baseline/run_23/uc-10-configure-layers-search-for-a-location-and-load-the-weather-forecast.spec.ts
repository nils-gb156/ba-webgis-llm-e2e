// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  let temperatureToggle = page.getByLabel(/^Temperature$/i);
  if (await temperatureToggle.count() === 0) temperatureToggle = page.getByLabel(/Temperature/i);
  if (await temperatureToggle.count() === 0) temperatureToggle = page.getByRole('checkbox', { name: /^Temperature$/i });
  if (await temperatureToggle.count() === 0) temperatureToggle = page.getByRole('switch', { name: /^Temperature$/i });
  if (await temperatureToggle.count() === 0) temperatureToggle = page.getByRole('checkbox', { name: /Temperature/i });
  if (await temperatureToggle.count() === 0) temperatureToggle = page.getByRole('switch', { name: /Temperature/i });
  temperatureToggle = temperatureToggle.first();

  let precipitationToggle = page.getByLabel(/^Precipitation$/i);
  if (await precipitationToggle.count() === 0) precipitationToggle = page.getByLabel(/Precipitation/i);
  if (await precipitationToggle.count() === 0) precipitationToggle = page.getByRole('checkbox', { name: /^Precipitation$/i });
  if (await precipitationToggle.count() === 0) precipitationToggle = page.getByRole('switch', { name: /^Precipitation$/i });
  if (await precipitationToggle.count() === 0) precipitationToggle = page.getByRole('checkbox', { name: /Precipitation/i });
  if (await precipitationToggle.count() === 0) precipitationToggle = page.getByRole('switch', { name: /Precipitation/i });
  precipitationToggle = precipitationToggle.first();

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();
  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  let searchField = page.getByRole('combobox', { name: /search|location|place|address|ort|suche/i });
  if (await searchField.count() === 0) searchField = page.getByRole('searchbox');
  if (await searchField.count() === 0) searchField = page.getByRole('textbox', { name: /search|location|place|address|ort|suche/i });
  if (await searchField.count() === 0) searchField = page.getByPlaceholder(/search|location|place|address|ort|suche/i);
  searchField = searchField.first();

  await expect(searchField).toBeVisible();

  const measurementButton = page.getByRole('button', { name: /measure|measurement|messen/i }).first();
  if (await measurementButton.count() > 0) {
    const ariaPressed = await measurementButton.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      await expect(measurementButton).toHaveAttribute('aria-pressed', 'false');
    }
  }

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const precipitationAriaLabel = await precipitationToggle.getAttribute('aria-label');
  if (precipitationAriaLabel !== null) {
    expect(precipitationAriaLabel).toMatch(/disable|hide|ausblenden/i);
  }

  const temperatureAriaLabel = await temperatureToggle.getAttribute('aria-label');
  if (temperatureAriaLabel !== null) {
    expect(temperatureAriaLabel).toMatch(/enable|show|anzeigen/i);
  }

  const forecastRequestUrls: string[] = [];
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    if ((resourceType === 'fetch' || resourceType === 'xhr') && /forecast|weather/i.test(request.url())) {
      forecastRequestUrls.push(request.url());
    }
  });

  await searchField.click();
  await searchField.fill('Münster');

  const resultsList = page.getByRole('listbox').first();
  if (await resultsList.count() > 0) {
    await expect(resultsList).toBeVisible();
  }

  let firstResult = page.getByRole('option').first();
  if (await firstResult.count() === 0) {
    firstResult = page.getByRole('listitem').filter({ hasText: /Münster/i }).first();
  }
  if (await firstResult.count() === 0) {
    firstResult = page.getByRole('button', { name: /Münster/i }).first();
  }

  await expect(firstResult).toBeVisible();
  const selectedResultText = ((await firstResult.textContent()) ?? 'Münster').trim();

  const forecastResponsePromise = page.waitForResponse((response) => {
    const resourceType = response.request().resourceType();
    const contentType = response.headers()['content-type'] ?? response.headers()['Content-Type'] ?? '';
    return (
      (resourceType === 'fetch' || resourceType === 'xhr') &&
      /forecast|weather/i.test(response.url()) &&
      response.ok() &&
      /json/i.test(contentType)
    );
  });

  await firstResult.click();

  await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(0);
  await expect(searchField).toHaveValue(/Münster/i);

  const forecastResponse = await forecastResponsePromise;
  const forecastPayload = (await forecastResponse.json()) as unknown;

  const findForecastEntryCount = (value: unknown): number | undefined => {
    if (Array.isArray(value)) {
      if (value.length === 24) {
        return value.length;
      }

      for (const entry of value) {
        const nestedCount = findForecastEntryCount(entry);
        if (nestedCount !== undefined) {
          return nestedCount;
        }
      }

      return undefined;
    }

    if (value !== null && typeof value === 'object') {
      for (const nestedValue of Object.values(value as Record<string, unknown>)) {
        const nestedCount = findForecastEntryCount(nestedValue);
        if (nestedCount !== undefined) {
          return nestedCount;
        }
      }
    }

    return undefined;
  };

  expect(findForecastEntryCount(forecastPayload)).toBe(24);

  let forecastHeading = page.getByRole('heading', { name: /weather forecast|forecast|wettervorhersage|vorhersage/i });
  if (await forecastHeading.count() === 0) {
    forecastHeading = page.getByText(/weather forecast|forecast|wettervorhersage|vorhersage/i).first();
  }

  await expect(forecastHeading.first()).toBeVisible();
});
