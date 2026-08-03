// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const temperatureToggle = page.getByRole('checkbox', { name: /Temperature/i });
  const precipitationToggle = page.getByRole('checkbox', { name: /Precipitation/i });

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const searchField = page
    .getByRole('combobox')
    .or(page.getByRole('searchbox'))
    .or(page.getByRole('textbox', { name: /search/i }))
    .first();

  await expect(searchField).toBeVisible();
  await searchField.click();
  await searchField.fill('Münster');

  const firstResult = page.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  const weatherRequests: string[] = [];
  const weatherRequestListener = (request: Parameters<typeof page.on>[1] extends (
    event: 'request',
    listener: infer L
  ) => void
    ? L
    : never) => {
    if (/weather|forecast/i.test(request.url())) {
      weatherRequests.push(request.url());
    }
  };

  page.on('request', weatherRequestListener);
  const weatherResponsePromise = page.waitForResponse(
    (response) => /weather|forecast/i.test(response.url()) && response.ok()
  );

  await firstResult.click();

  await expect(searchField).toHaveValue(/Münster/i);
  await expect(firstResult).not.toBeVisible();

  await expect.poll(() => weatherRequests.length).toBeGreaterThan(0);
  await weatherResponsePromise;
  page.off('request', weatherRequestListener);

  const forecastHeading = page.getByRole('heading', { name: /forecast/i }).first();
  await expect(forecastHeading).toBeVisible();

  await expect(page.getByText(/\b\d{1,2}:\d{2}\b/)).toHaveCount(24);
});
