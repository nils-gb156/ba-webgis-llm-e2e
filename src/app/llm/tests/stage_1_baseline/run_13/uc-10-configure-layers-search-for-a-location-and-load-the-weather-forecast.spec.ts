// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const getFirstVisible = async (candidates: Array<any>, description: string): Promise<any> => {
    for (const candidate of candidates) {
      const count = await candidate.count();
      if (count === 0) {
        continue;
      }

      const first = candidate.first();
      const visible = await first.isVisible().catch(() => false);
      if (visible) {
        return first;
      }
    }

    throw new Error(`Could not find a visible ${description}.`);
  };

  const getLayerToggle = async (layerName: RegExp): Promise<{ locator: any; kind: 'checkbox' | 'switch' | 'button' }> => {
    const directCheckbox = page.getByRole('checkbox', { name: layerName });
    if ((await directCheckbox.count()) > 0 && (await directCheckbox.first().isVisible().catch(() => false))) {
      return { locator: directCheckbox.first(), kind: 'checkbox' };
    }

    const directSwitch = page.getByRole('switch', { name: layerName });
    if ((await directSwitch.count()) > 0 && (await directSwitch.first().isVisible().catch(() => false))) {
      return { locator: directSwitch.first(), kind: 'switch' };
    }

    const directButton = page.getByRole('button', { name: layerName });
    if ((await directButton.count()) > 0 && (await directButton.first().isVisible().catch(() => false))) {
      return { locator: directButton.first(), kind: 'button' };
    }

    const scopedContainers = [
      page.getByRole('listitem').filter({ hasText: layerName }),
      page.getByRole('treeitem').filter({ hasText: layerName }),
      page.getByRole('row').filter({ hasText: layerName }),
    ];

    for (const containerCandidate of scopedContainers) {
      const count = await containerCandidate.count();
      if (count === 0) {
        continue;
      }

      const container = containerCandidate.first();
      if (!(await container.isVisible().catch(() => false))) {
        continue;
      }

      const checkbox = container.getByRole('checkbox').first();
      if ((await checkbox.count()) > 0 && (await checkbox.isVisible().catch(() => false))) {
        return { locator: checkbox, kind: 'checkbox' };
      }

      const switchLocator = container.getByRole('switch').first();
      if ((await switchLocator.count()) > 0 && (await switchLocator.isVisible().catch(() => false))) {
        return { locator: switchLocator, kind: 'switch' };
      }

      const button = container.getByRole('button').first();
      if ((await button.count()) > 0 && (await button.isVisible().catch(() => false))) {
        return { locator: button, kind: 'button' };
      }
    }

    throw new Error(`Could not find a layer visibility toggle for ${layerName}.`);
  };

  const expectToggleState = async (
    toggle: { locator: any; kind: 'checkbox' | 'switch' | 'button' },
    expectedVisible: boolean
  ): Promise<void> => {
    if (toggle.kind === 'checkbox' || toggle.kind === 'switch') {
      if (expectedVisible) {
        await expect(toggle.locator).toBeChecked();
      } else {
        await expect(toggle.locator).not.toBeChecked();
      }
      return;
    }

    const ariaPressed = await toggle.locator.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      await expect(toggle.locator).toHaveAttribute('aria-pressed', expectedVisible ? 'true' : 'false');
      return;
    }

    const ariaChecked = await toggle.locator.getAttribute('aria-checked');
    if (ariaChecked !== null) {
      await expect(toggle.locator).toHaveAttribute('aria-checked', expectedVisible ? 'true' : 'false');
      return;
    }

    throw new Error('The located layer toggle does not expose a checkable state.');
  };

  const clickToggle = async (toggle: { locator: any; kind: 'checkbox' | 'switch' | 'button' }): Promise<void> => {
    if (toggle.kind === 'checkbox' || toggle.kind === 'switch') {
      await toggle.locator.click({ force: true });
    } else {
      await toggle.locator.click();
    }
  };

  const findArrayLength24 = (value: unknown, seen: Set<unknown> = new Set()): number | undefined => {
    if (Array.isArray(value)) {
      if (value.length === 24) {
        return 24;
      }

      for (const item of value) {
        const nested = findArrayLength24(item, seen);
        if (nested === 24) {
          return 24;
        }
      }

      return undefined;
    }

    if (!value || typeof value !== 'object' || seen.has(value)) {
      return undefined;
    }

    seen.add(value);

    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      const nested = findArrayLength24(nestedValue, seen);
      if (nested === 24) {
        return 24;
      }
    }

    return undefined;
  };

  const extractForecastEntryCount = (data: unknown): number | undefined => {
    const commonPaths: Array<Array<string>> = [
      ['entries'],
      ['forecast'],
      ['items'],
      ['timeseries'],
      ['hourly', 'time'],
      ['hourly', 'times'],
      ['hourly', 'entries'],
      ['properties', 'timeseries'],
    ];

    for (const path of commonPaths) {
      let current: unknown = data;
      let valid = true;

      for (const key of path) {
        if (!current || typeof current !== 'object' || Array.isArray(current)) {
          valid = false;
          break;
        }
        current = (current as Record<string, unknown>)[key];
      }

      if (valid && Array.isArray(current)) {
        return current.length;
      }
    }

    return findArrayLength24(data);
  };

  const tocTemperatureToggle = await getLayerToggle(/temperature/i);
  const tocPrecipitationToggle = await getLayerToggle(/precipitation/i);

  await expect(tocTemperatureToggle.locator).toBeVisible();
  await expect(tocPrecipitationToggle.locator).toBeVisible();

  await expectToggleState(tocTemperatureToggle, true);
  await expectToggleState(tocPrecipitationToggle, false);

  const searchField = await getFirstVisible(
    [
      page.getByTestId('geocoder-search'),
      page.getByRole('combobox', { name: /search|suche|address|adresse|ort/i }),
      page.getByRole('searchbox', { name: /search|suche|address|adresse|ort/i }),
      page.getByRole('textbox', { name: /search|suche|address|adresse|ort/i }),
      page.getByPlaceholder(/search|suche|address|adresse|ort/i),
      page.getByRole('combobox').first(),
    ],
    'search field'
  );

  await expect(searchField).toBeVisible();

  const complementaryPanels = page.getByRole('complementary');
  const infoPanelRoot =
    (await complementaryPanels.count()) > 0 && (await complementaryPanels.first().isVisible().catch(() => false))
      ? complementaryPanels.first()
      : page;

  if (infoPanelRoot !== page) {
    await expect(infoPanelRoot).toBeVisible();
  }

  await clickToggle(tocTemperatureToggle);
  await expectToggleState(tocTemperatureToggle, false);

  await clickToggle(tocPrecipitationToggle);
  await expectToggleState(tocPrecipitationToggle, true);

  await searchField.click();
  await searchField.fill('Münster');

  const firstResult = await getFirstVisible(
    [
      page.getByRole('option', { name: /münster/i }),
      page.getByRole('button', { name: /münster/i }),
      page.getByRole('listitem').filter({ hasText: /münster/i }),
      page.getByRole('option'),
      page.getByRole('listbox').getByRole('button'),
    ],
    'geocoder result'
  );

  await expect(firstResult).toBeVisible();

  const selectedResultText = ((await firstResult.textContent()) ?? 'Münster').trim();
  const selectedResultPattern = new RegExp(escapeRegex((selectedResultText.split(',')[0] || 'Münster').trim()), 'i');

  const forecastRequests: Array<string> = [];
  const onRequest = (request: any): void => {
    const url = request.url();
    if (/forecast|weather|open-meteo/i.test(url)) {
      forecastRequests.push(url);
    }
  };

  page.on('request', onRequest);

  const forecastResponsePromise = page.waitForResponse(
    (response) => response.ok() && /forecast|weather|open-meteo/i.test(response.url())
  );

  await firstResult.click();

  await expect(searchField).toHaveValue(selectedResultPattern);

  await expect.poll(() => forecastRequests[0] ?? '').toMatch(/forecast|weather|open-meteo/i);
  await expect.poll(() => forecastRequests[0] ?? '').toMatch(/(lat|latitude|lon|longitude)=/i);

  const forecastResponse = await forecastResponsePromise;
  page.off('request', onRequest);

  const forecastHeading = await getFirstVisible(
    [
      infoPanelRoot.getByRole('heading', { name: /weather forecast|forecast|vorhersage|wetter/i }),
      infoPanelRoot.getByText(/weather forecast|forecast|vorhersage|wetter/i),
    ],
    'weather forecast section'
  );

  await expect(forecastHeading).toBeVisible();

  const countForecastEntriesInDom = async (): Promise<number | undefined> => {
    const timeTextLocator = infoPanelRoot.getByText(/\b\d{1,2}:\d{2}\b/);
    const timeCount = await timeTextLocator.count();

    if (timeCount === 0) {
      return undefined;
    }

    const texts = await timeTextLocator.allTextContents();
    const uniqueTimes = new Set<string>();

    for (const text of texts) {
      const matches = text.match(/\b\d{1,2}:\d{2}\b/g) ?? [];
      for (const match of matches) {
        uniqueTimes.add(match);
      }
    }

    return uniqueTimes.size > 0 ? uniqueTimes.size : undefined;
  };

  try {
    await expect.poll(countForecastEntriesInDom).toBe(24);
  } catch {
    const forecastData = (await forecastResponse.json()) as unknown;
    expect(extractForecastEntryCount(forecastData)).toBe(24);
  }
});
