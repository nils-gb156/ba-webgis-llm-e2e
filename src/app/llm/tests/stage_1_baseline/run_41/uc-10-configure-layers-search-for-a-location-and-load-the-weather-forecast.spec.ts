// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const temperatureToggle = page.getByRole('checkbox', { name: /temperature/i });
  const precipitationToggle = page.getByRole('checkbox', { name: /precipitation/i });

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();
  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  const searchField = page.getByRole('combobox').first();
  await expect(searchField).toBeVisible();
  await searchField.click();
  await searchField.fill('Münster');

  const resultList = page.getByRole('listbox');
  await expect(resultList).toBeVisible();

  const firstResult = resultList.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  const forecastRequestUrls: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (/(forecast|weather)/i.test(url)) {
      forecastRequestUrls.push(url);
    }
  });

  await firstResult.click();

  await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(0);
  await expect.poll(() => forecastRequestUrls[forecastRequestUrls.length - 1] ?? '').toMatch(
    /lat(?:itude)?=[\d.-]+.*lon(?:gitude)?=[\d.-]+|lon(?:gitude)?=[\d.-]+.*lat(?:itude)?=[\d.-]+/i
  );

  const forecastHeading = page.getByRole('heading', { name: /weather forecast|forecast/i });
  await expect(forecastHeading).toBeVisible();

  const forecastRegion = page.getByRole('region', { name: /weather forecast|forecast/i });
  await expect(forecastRegion).toBeVisible();
  await expect(forecastRegion.getByRole('listitem')).toHaveCount(24);
});
