// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  const weatherRequestUrls: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/forecast|weather|meteo|dwd/i.test(url)) {
      weatherRequestUrls.push(url);
    }
  });

  const escapeForRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const findLayerToggle = async (label: RegExp) => {
    let toggle = page.getByRole('switch', { name: label }).first();
    if (await toggle.count()) {
      return toggle;
    }

    toggle = page.getByRole('checkbox', { name: label }).first();
    if (await toggle.count()) {
      return toggle;
    }

    const item = page.getByRole('listitem').filter({ has: page.getByText(label) }).first();

    toggle = item.getByRole('switch').first();
    if (await toggle.count()) {
      return toggle;
    }

    return item.getByRole('checkbox').first();
  };

  const findSearchField = async () => {
    let field = page.getByRole('searchbox').first();
    if (await field.count()) {
      return field;
    }

    field = page.getByRole('textbox', { name: /search/i }).first();
    if (await field.count()) {
      return field;
    }

    field = page.getByRole('combobox', { name: /search/i }).first();
    if (await field.count()) {
      return field;
    }

    return page.getByPlaceholder(/search/i).first();
  };

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const searchField = await findSearchField();
  await expect(searchField).toBeVisible();

  let infoPanel = page.getByRole('region', { name: /forecast|weather|info/i }).first();
  if (await infoPanel.count() === 0) {
    infoPanel = page.getByRole('complementary', { name: /forecast|weather|info/i }).first();
  }
  if (await infoPanel.count() === 0) {
    infoPanel = page.locator('aside').last();
  }
  await expect(infoPanel).toBeVisible();

  let forecastHeading = infoPanel.getByRole('heading', { name: /forecast|weather/i }).first();
  if (await forecastHeading.count() === 0) {
    forecastHeading = page.getByRole('heading', { name: /forecast|weather/i }).first();
  }
  await expect(forecastHeading).toBeVisible();

  const measurementButton = page.getByRole('button', { name: /measure/i }).first();
  if (await measurementButton.count()) {
    await expect(measurementButton).toHaveAttribute('aria-pressed', 'false');
  }

  await expect(page.getByText(/Temperature/i).first()).toBeVisible();
  await expect(page.getByText(/Precipitation/i).first()).toBeVisible();

  const temperatureToggle = await findLayerToggle(/Temperature/i);
  const precipitationToggle = await findLayerToggle(/Precipitation/i);

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();

  await expect(temperatureToggle).toBeChecked();
  await expect(precipitationToggle).not.toBeChecked();

  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  await searchField.click();
  await searchField.fill('Münster');

  await expect.poll(async () => {
    const optionCount = await page.getByRole('option').count();
    if (optionCount > 0) {
      return optionCount;
    }
    return await page.getByRole('listitem').filter({ has: page.getByText(/Münster/i) }).count();
  }).toBeGreaterThan(0);

  let firstResult = page.getByRole('option').first();
  if (await firstResult.count() === 0) {
    firstResult = page.getByRole('listitem').filter({ has: page.getByText(/Münster/i) }).first();
  }

  await expect(firstResult).toBeVisible();

  const selectedResultText = ((await firstResult.textContent()) ?? '').trim();
  weatherRequestUrls.length = 0;

  await firstResult.click();
  await page.waitForLoadState('networkidle');

  await expect(firstResult).not.toBeVisible();

  if (selectedResultText) {
    const compactSelectedResultText =
      selectedResultText
        .split('\n')
        .map((part) => part.trim())
        .filter(Boolean)[0] ?? 'Münster';
    await expect(searchField).toHaveValue(new RegExp(escapeForRegex(compactSelectedResultText), 'i'));
  } else {
    await expect(searchField).toHaveValue(/Münster/i);
  }

  await expect.poll(() => weatherRequestUrls.length).toBeGreaterThan(0);
  await expect(forecastHeading).toBeVisible();

  await expect.poll(async () => {
    const listItemCount = await infoPanel.getByRole('listitem').count();
    if (listItemCount === 24) {
      return 24;
    }

    const articleCount = await infoPanel.getByRole('article').count();
    if (articleCount === 24) {
      return 24;
    }

    const rowCount = await infoPanel.getByRole('row').count();
    if (rowCount === 25 || rowCount === 24) {
      return 24;
    }

    const plainListItemCount = await infoPanel.locator('li').count();
    if (plainListItemCount === 24) {
      return 24;
    }

    return Math.max(listItemCount, articleCount, rowCount > 0 ? rowCount - 1 : 0, plainListItemCount);
  }).toBe(24);
});
