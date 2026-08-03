// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const getLayerToggle = async (name: string) => {
    const checkbox = page.getByRole('checkbox', { name, exact: true });
    if (await checkbox.count()) {
      return { locator: checkbox, kind: 'checkable' as const };
    }

    const switchControl = page.getByRole('switch', { name, exact: true });
    if (await switchControl.count()) {
      return { locator: switchControl, kind: 'checkable' as const };
    }

    return { locator: page.getByRole('button', { name, exact: true }), kind: 'button' as const };
  };

  const expectLayerVisible = async (toggle: { locator: ReturnType<typeof page.getByRole>; kind: 'checkable' | 'button' }) => {
    if (toggle.kind === 'checkable') {
      await expect(toggle.locator).toBeChecked();
      return;
    }

    const ariaPressed = await toggle.locator.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      await expect(toggle.locator).toHaveAttribute('aria-pressed', 'true');
      return;
    }

    await expect(toggle.locator).toHaveAttribute('aria-checked', 'true');
  };

  const expectLayerHidden = async (toggle: { locator: ReturnType<typeof page.getByRole>; kind: 'checkable' | 'button' }) => {
    if (toggle.kind === 'checkable') {
      await expect(toggle.locator).not.toBeChecked();
      return;
    }

    const ariaPressed = await toggle.locator.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      await expect(toggle.locator).toHaveAttribute('aria-pressed', 'false');
      return;
    }

    await expect(toggle.locator).toHaveAttribute('aria-checked', 'false');
  };

  const clickLayerToggle = async (toggle: { locator: ReturnType<typeof page.getByRole>; kind: 'checkable' | 'button' }) => {
    if (toggle.kind === 'checkable') {
      await toggle.locator.click({ force: true });
      return;
    }

    await toggle.locator.click();
  };

  await expect(page.getByRole('main')).toBeVisible();

  const temperatureToggle = await getLayerToggle('Temperature');
  const precipitationToggle = await getLayerToggle('Precipitation');

  await expect(temperatureToggle.locator).toBeVisible();
  await expect(precipitationToggle.locator).toBeVisible();

  await expectLayerVisible(temperatureToggle);
  await expectLayerHidden(precipitationToggle);

  const searchField =
    (await page.getByRole('combobox', { name: /search/i }).count()) > 0
      ? page.getByRole('combobox', { name: /search/i }).first()
      : page.getByRole('textbox', { name: /search/i }).first();

  await expect(searchField).toBeVisible();

  const infoPanelCandidates = page.getByRole('complementary');
  if ((await infoPanelCandidates.count()) > 0) {
    await expect(infoPanelCandidates.last()).toBeVisible();
  } else {
    const infoRegion = page.getByRole('region', { name: /info|information/i });
    if ((await infoRegion.count()) > 0) {
      await expect(infoRegion.first()).toBeVisible();
    }
  }

  const measurementButtons = page.getByRole('button', { name: /measure|measurement/i });
  if ((await measurementButtons.count()) > 0) {
    await expect.poll(async () => measurementButtons.first().getAttribute('aria-pressed')).not.toBe('true');
  }

  await clickLayerToggle(temperatureToggle);
  await expectLayerHidden(temperatureToggle);

  await clickLayerToggle(precipitationToggle);
  await expectLayerVisible(precipitationToggle);

  const forecastRequestUrls: string[] = [];
  page.on('request', (request) => {
    const url = request.url().toLowerCase();
    if (url.includes('forecast') || url.includes('weather')) {
      forecastRequestUrls.push(request.url());
    }
  });
  const initialForecastRequestCount = forecastRequestUrls.length;

  await searchField.click();
  await searchField.fill('Münster');

  await expect.poll(async () => {
    const optionCount = await page.getByRole('option').filter({ hasText: /Münster/i }).count();
    const buttonCount = await page.getByRole('button', { name: /Münster/i }).count();
    const listItemCount = await page.getByRole('listitem').filter({ hasText: /Münster/i }).count();
    return Math.max(optionCount, buttonCount, listItemCount);
  }).toBeGreaterThan(0);

  const firstResult =
    (await page.getByRole('option').filter({ hasText: /Münster/i }).count()) > 0
      ? page.getByRole('option').filter({ hasText: /Münster/i }).first()
      : (await page.getByRole('button', { name: /Münster/i }).count()) > 0
        ? page.getByRole('button', { name: /Münster/i }).first()
        : page.getByRole('listitem').filter({ hasText: /Münster/i }).first();

  const selectedResultText = ((await firstResult.textContent()) ?? 'Münster').trim();

  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect(searchField).toHaveValue(/Münster/i);
  await page.waitForLoadState('networkidle');

  await expect.poll(() => forecastRequestUrls.length).toBeGreaterThan(initialForecastRequestCount);

  const forecastHeading = page.getByRole('heading', { name: /weather forecast|forecast/i });
  await expect(forecastHeading).toBeVisible();

  const getForecastContainer = async () => {
    const complementaryWithForecast = page
      .getByRole('complementary')
      .filter({ has: page.getByRole('heading', { name: /weather forecast|forecast/i }) });
    if (await complementaryWithForecast.count()) {
      return complementaryWithForecast.first();
    }

    const regionWithForecast = page
      .getByRole('region')
      .filter({ has: page.getByRole('heading', { name: /weather forecast|forecast/i }) });
    if (await regionWithForecast.count()) {
      return regionWithForecast.first();
    }

    return page.getByRole('main');
  };

  const getForecastEntryCount = async () => {
    const container = await getForecastContainer();

    const listItemCount = await container.getByRole('listitem').count();
    if (listItemCount === 24) {
      return 24;
    }

    const rowCount = await container.getByRole('row').count();
    if (rowCount === 24) {
      return 24;
    }
    if (rowCount === 25) {
      return 24;
    }

    const articleCount = await container.getByRole('article').count();
    if (articleCount === 24) {
      return 24;
    }

    const timeLabelCount = await container.getByText(/^\d{1,2}:\d{2}$/).count();
    if (timeLabelCount === 24) {
      return 24;
    }

    return Math.max(listItemCount, rowCount === 25 ? 24 : rowCount, articleCount, timeLabelCount);
  };

  await expect.poll(getForecastEntryCount).toBe(24);

  await expect(searchField).toHaveValue(/Münster/i);
  await expect(page.getByText(selectedResultText.split(',')[0], { exact: false }).first()).toBeVisible();
});
