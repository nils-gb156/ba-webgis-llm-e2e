// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const findFirstVisible = async (candidates: Array<ReturnType<typeof page.locator>>) => {
    for (const candidate of candidates) {
      const first = candidate.first();
      if (await first.isVisible()) {
        return first;
      }
    }
    throw new Error('No visible locator found for the provided candidates.');
  };

  const getToggleState = async (locator: ReturnType<typeof page.locator>) => {
    const role = await locator.getAttribute('role');

    if (role === 'checkbox' || role === 'switch') {
      return await locator.isChecked();
    }

    const ariaPressed = await locator.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      return ariaPressed === 'true';
    }

    const ariaChecked = await locator.getAttribute('aria-checked');
    if (ariaChecked !== null) {
      return ariaChecked === 'true';
    }

    throw new Error('Could not determine toggle state.');
  };

  const ensureToggleState = async (locator: ReturnType<typeof page.locator>, desiredState: boolean) => {
    const currentState = await getToggleState(locator);
    if (currentState !== desiredState) {
      await locator.click({ force: true });
    }

    await expect.poll(async () => await getToggleState(locator)).toBe(desiredState);
  };

  const temperatureToggle = await findFirstVisible([
    page.getByRole('switch', { name: /temperature/i }),
    page.getByRole('checkbox', { name: /temperature/i }),
    page.getByRole('button', { name: /temperature/i }),
    page.getByLabel(/temperature/i)
  ]);

  const precipitationToggle = await findFirstVisible([
    page.getByRole('switch', { name: /precipitation/i }),
    page.getByRole('checkbox', { name: /precipitation/i }),
    page.getByRole('button', { name: /precipitation/i }),
    page.getByLabel(/precipitation/i)
  ]);

  const searchField = await findFirstVisible([
    page.getByRole('combobox', { name: /search|location|place/i }),
    page.getByRole('textbox', { name: /search|location|place/i }),
    page.getByLabel(/search|location|place/i),
    page.getByPlaceholder(/search|location|place/i)
  ]);

  const infoPanel = await findFirstVisible([
    page.getByRole('complementary'),
    page.getByRole('region', { name: /info|forecast|weather/i })
  ]);

  await expect(temperatureToggle).toBeVisible();
  await expect(precipitationToggle).toBeVisible();
  await expect(searchField).toBeVisible();
  await expect(infoPanel).toBeVisible();

  await expect.poll(async () => await getToggleState(temperatureToggle)).toBe(true);
  await expect.poll(async () => await getToggleState(precipitationToggle)).toBe(false);

  await ensureToggleState(temperatureToggle, false);
  await ensureToggleState(precipitationToggle, true);

  await expect.poll(async () => await getToggleState(temperatureToggle)).toBe(false);
  await expect.poll(async () => await getToggleState(precipitationToggle)).toBe(true);

  await searchField.click();
  await searchField.fill('Münster');

  const resultCandidates = [
    page.getByRole('option', { name: /münster/i }),
    page.getByRole('button', { name: /münster/i }),
    page.getByRole('link', { name: /münster/i }),
    page.getByRole('listitem').filter({ hasText: /münster/i })
  ];

  await expect.poll(async () => {
    for (const candidate of resultCandidates) {
      if (await candidate.first().isVisible()) {
        return true;
      }
    }
    return false;
  }).toBe(true);

  const firstResult = await findFirstVisible(resultCandidates);
  const selectedResultText = (await firstResult.innerText()).trim();

  await firstResult.click();
  await page.waitForLoadState('networkidle');

  await expect.poll(async () => await searchField.inputValue()).toMatch(/münster/i);

  const forecastHeading = await findFirstVisible([
    infoPanel.getByRole('heading', { name: /weather forecast|forecast/i }),
    infoPanel.getByText(/weather forecast|forecast/i)
  ]);

  await expect(forecastHeading).toBeVisible();

  await expect.poll(async () => {
    const listItemCount = await infoPanel.getByRole('listitem').count();
    if (listItemCount > 0) {
      return listItemCount;
    }

    const rowCount = await infoPanel.getByRole('row').count();
    if (rowCount > 1) {
      return rowCount - 1;
    }

    const articleCount = await infoPanel.getByRole('article').count();
    if (articleCount > 0) {
      return articleCount;
    }

    const timeLabelCount = await infoPanel.getByText(/\b\d{1,2}:\d{2}\b/).count();
    if (timeLabelCount > 0) {
      return timeLabelCount;
    }

    return 0;
  }).toBe(24);

  await expect(searchField).toHaveValue(new RegExp(selectedResultText.includes('Münster') ? 'Münster' : 'münster', 'i'));
});
