// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const findLayerControl = async (layerName: string) => {
    const namePattern = new RegExp(`\\b${escapeRegExp(layerName)}\\b`, 'i');

    const directCheckbox = page.getByRole('checkbox', { name: namePattern }).first();
    if ((await directCheckbox.count()) > 0) {
      await expect(directCheckbox).toBeVisible();
      return { kind: 'check' as const, locator: directCheckbox };
    }

    const directSwitch = page.getByRole('switch', { name: namePattern }).first();
    if ((await directSwitch.count()) > 0) {
      await expect(directSwitch).toBeVisible();
      return { kind: 'check' as const, locator: directSwitch };
    }

    const directButton = page.getByRole('button', { name: namePattern }).first();
    if ((await directButton.count()) > 0) {
      const ariaPressed = await directButton.getAttribute('aria-pressed');
      const ariaChecked = await directButton.getAttribute('aria-checked');
      if (ariaPressed !== null || ariaChecked !== null) {
        await expect(directButton).toBeVisible();
        return { kind: 'button' as const, locator: directButton };
      }
    }

    const containers = [
      page.getByRole('listitem').filter({ hasText: namePattern }),
      page.getByRole('row').filter({ hasText: namePattern }),
      page.getByRole('treeitem').filter({ hasText: namePattern })
    ];

    for (const candidate of containers) {
      const container = candidate.first();
      if ((await container.count()) === 0) {
        continue;
      }

      await expect(container).toBeVisible();

      const checkbox = container.getByRole('checkbox').first();
      if ((await checkbox.count()) > 0) {
        await expect(checkbox).toBeVisible();
        return { kind: 'check' as const, locator: checkbox };
      }

      const switchControl = container.getByRole('switch').first();
      if ((await switchControl.count()) > 0) {
        await expect(switchControl).toBeVisible();
        return { kind: 'check' as const, locator: switchControl };
      }

      const ariaToggle = container.locator('[aria-pressed], [aria-checked]').first();
      if ((await ariaToggle.count()) > 0) {
        await expect(ariaToggle).toBeVisible();
        return { kind: 'button' as const, locator: ariaToggle };
      }

      const button = container.getByRole('button').first();
      if ((await button.count()) > 0) {
        await expect(button).toBeVisible();
        return { kind: 'button' as const, locator: button };
      }
    }

    throw new Error(`Could not find a visibility control for layer "${layerName}".`);
  };

  const getToggleState = async (control: Awaited<ReturnType<typeof findLayerControl>>) => {
    if (control.kind === 'check') {
      const ariaChecked = await control.locator.getAttribute('aria-checked');
      if (ariaChecked !== null) {
        return ariaChecked === 'true';
      }
      return await control.locator.isChecked();
    }

    const ariaPressed = await control.locator.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      return ariaPressed === 'true';
    }

    const ariaChecked = await control.locator.getAttribute('aria-checked');
    if (ariaChecked !== null) {
      return ariaChecked === 'true';
    }

    throw new Error('Toggle control does not expose aria-pressed or aria-checked.');
  };

  const expectToggleState = async (control: Awaited<ReturnType<typeof findLayerControl>>, expectedState: boolean) => {
    if (control.kind === 'check') {
      if (expectedState) {
        await expect(control.locator).toBeChecked();
      } else {
        await expect(control.locator).not.toBeChecked();
      }
      return;
    }

    await expect.poll(async () => {
      const ariaPressed = await control.locator.getAttribute('aria-pressed');
      if (ariaPressed !== null) {
        return ariaPressed;
      }
      const ariaChecked = await control.locator.getAttribute('aria-checked');
      return ariaChecked;
    }).toBe(expectedState ? 'true' : 'false');
  };

  const setToggleState = async (control: Awaited<ReturnType<typeof findLayerControl>>, expectedState: boolean) => {
    const currentState = await getToggleState(control);
    if (currentState !== expectedState) {
      if (control.kind === 'check') {
        await control.locator.click({ force: true });
      } else {
        await control.locator.click();
      }
    }
    await expectToggleState(control, expectedState);
  };

  const temperatureToggle = await findLayerControl('Temperature');
  const precipitationToggle = await findLayerControl('Precipitation');

  await expectToggleState(temperatureToggle, true);
  await expectToggleState(precipitationToggle, false);

  const searchField = page.getByRole('combobox').first();
  await expect(searchField).toBeVisible();

  const infoPanel = page.getByRole('complementary').first();
  if ((await infoPanel.count()) > 0) {
    await expect(infoPanel).toBeVisible();
  }

  await setToggleState(temperatureToggle, false);
  await setToggleState(precipitationToggle, true);

  await searchField.click();
  await searchField.fill('Münster');

  const resultsList = page.getByRole('listbox').first();
  await expect(resultsList).toBeVisible();

  const firstResult = resultsList.getByRole('option').first();
  await expect(firstResult).toBeVisible();

  const selectedResultText = (await firstResult.innerText())
    .split('\n')
    .map((part) => part.trim())
    .filter(Boolean)[0] ?? 'Münster';

  let capturedForecastRequestUrl: string | undefined;
  page.on('request', (request) => {
    if (/forecast|weather/i.test(request.url())) {
      capturedForecastRequestUrl = request.url();
    }
  });

  const forecastResponsePromise = page.waitForResponse((response) => {
    return /forecast|weather/i.test(response.url()) && response.ok();
  });

  await firstResult.click();

  await expect(searchField).toHaveValue(new RegExp(escapeRegExp(selectedResultText), 'i'));
  await expect.poll(() => capturedForecastRequestUrl ?? '').toMatch(/forecast|weather/i);

  const forecastResponse = await forecastResponsePromise;
  const forecastPayload = await forecastResponse.json();

  const readNumericValue = (source: unknown, keys: string[]) => {
    if (!source || typeof source !== 'object') {
      return undefined;
    }

    for (const key of keys) {
      const rawValue = (source as Record<string, unknown>)[key];
      if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
        return rawValue;
      }
      if (typeof rawValue === 'string' && rawValue.trim() !== '') {
        const parsed = Number(rawValue);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return undefined;
  };

  const readCoordinateFromUrl = (urlString: string | undefined, keys: string[]) => {
    if (!urlString) {
      return undefined;
    }
    const url = new URL(urlString);
    for (const key of keys) {
      const rawValue = url.searchParams.get(key);
      if (rawValue !== null && rawValue.trim() !== '') {
        const parsed = Number(rawValue);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
    return undefined;
  };

  let latitude =
    readCoordinateFromUrl(capturedForecastRequestUrl, ['latitude', 'lat']) ??
    readNumericValue(forecastPayload, ['latitude', 'lat']) ??
    readNumericValue((forecastPayload as Record<string, unknown>)?.location, ['latitude', 'lat']);

  let longitude =
    readCoordinateFromUrl(capturedForecastRequestUrl, ['longitude', 'lon', 'lng']) ??
    readNumericValue(forecastPayload, ['longitude', 'lon', 'lng']) ??
    readNumericValue((forecastPayload as Record<string, unknown>)?.location, ['longitude', 'lon', 'lng']);

  expect(latitude).not.toBeUndefined();
  expect(longitude).not.toBeUndefined();

  expect(latitude!).toBeGreaterThan(51);
  expect(latitude!).toBeLessThan(53);
  expect(longitude!).toBeGreaterThan(6.5);
  expect(longitude!).toBeLessThan(8.5);

  const forecastHeading = page.getByRole('heading', { name: /forecast/i }).first();
  await expect(forecastHeading).toBeVisible();

  const forecastSection = page
    .locator('section, [role="region"], [role="complementary"]')
    .filter({ has: forecastHeading })
    .first();

  await expect.poll(async () => {
    const section = (await forecastSection.count()) > 0 ? forecastSection : page.getByRole('complementary').first();

    const listItemCount = await section.getByRole('listitem').count();
    const rowCount = await section.getByRole('row').count();
    const timedButtonCount = await section.getByRole('button').filter({ hasText: /\b\d{1,2}:\d{2}\b/ }).count();
    const timedTextCount = await section.getByText(/\b\d{1,2}:\d{2}\b/).count();

    const candidateCounts = [
      listItemCount,
      rowCount > 1 ? rowCount - 1 : 0,
      timedButtonCount,
      timedTextCount === 24 ? 24 : 0
    ].filter((count) => count > 0);

    return candidateCounts.includes(24) ? 24 : Math.max(0, ...candidateCounts);
  }).toBe(24);

  await expectToggleState(temperatureToggle, false);
  await expectToggleState(precipitationToggle, true);
});
