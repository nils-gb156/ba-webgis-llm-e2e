// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const temperatureToggle = page
    .getByRole('checkbox', { name: /temperature/i })
    .or(page.getByRole('switch', { name: /temperature/i }))
    .first();

  const precipitationToggle = page
    .getByRole('checkbox', { name: /precipitation/i })
    .or(page.getByRole('switch', { name: /precipitation/i }))
    .first();

  const searchField = page
    .getByRole('combobox', { name: /search|suche/i })
    .or(page.getByRole('textbox', { name: /search|suche/i }))
    .or(page.getByPlaceholder(/search|suche/i))
    .first();

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();
  await expect(searchField).toBeVisible();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  await searchField.click();
  await searchField.fill('Münster');

  const firstResult = page.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  let forecastRequests: string[] = [];
  page.on('request', request => {
    if (/(forecast|weather)/i.test(request.url())) {
      forecastRequests.push(request.url());
    }
  });

  forecastRequests = [];
  await firstResult.click();

  await expect(searchField).toHaveValue(/münster/i);
  await expect.poll(() => forecastRequests.length).toBeGreaterThan(0);
  await expect.poll(() => forecastRequests[forecastRequests.length - 1]).toMatch(
    /(forecast|weather)/i
  );

  const forecastHeading = page
    .getByRole('heading', { name: /weather forecast|forecast|wettervorhersage/i })
    .first();
  await expect(forecastHeading).toBeVisible();

  await expect.poll(async () => {
    const timeLabelCount = await page.getByText(/^\d{1,2}:\d{2}$/).count();
    if (timeLabelCount > 0) {
      return timeLabelCount;
    }

    const forecastRegion = page.getByRole('region', {
      name: /weather forecast|forecast|wettervorhersage/i
    });

    if ((await forecastRegion.count()) > 0) {
      const listItemCount = await forecastRegion.getByRole('listitem').count();
      if (listItemCount > 0) {
        return listItemCount;
      }

      const rowCount = await forecastRegion.getByRole('row').count();
      if (rowCount > 1) {
        return rowCount - 1;
      }
    }

    return 0;
  }).toBe(24);
});
