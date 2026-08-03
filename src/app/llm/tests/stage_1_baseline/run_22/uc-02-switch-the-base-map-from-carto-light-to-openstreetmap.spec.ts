// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const cartoLightRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });
  const cartoLightMenuItem = page.getByRole('menuitemradio', { name: 'Carto Light', exact: true });
  const openStreetMapMenuItem = page.getByRole('menuitemradio', { name: 'OpenStreetMap', exact: true });

  let radioOptionsVisible =
    (await cartoLightRadio.count()) > 0 &&
    (await openStreetMapRadio.count()) > 0 &&
    (await cartoLightRadio.first().isVisible()) &&
    (await openStreetMapRadio.first().isVisible());

  let menuOptionsVisible =
    (await cartoLightMenuItem.count()) > 0 &&
    (await openStreetMapMenuItem.count()) > 0 &&
    (await cartoLightMenuItem.first().isVisible()) &&
    (await openStreetMapMenuItem.first().isVisible());

  if (!radioOptionsVisible && !menuOptionsVisible) {
    const selectorOpeners = [
      page.getByRole('button', { name: 'Carto Light', exact: true }),
      page.getByRole('button', { name: 'OpenStreetMap', exact: true }),
      page.getByRole('button', { name: 'Base maps', exact: true }),
      page.getByRole('button', { name: 'Basemaps', exact: true }),
      page.getByRole('button', { name: 'Base map', exact: true }),
      page.getByRole('button', { name: 'Background maps', exact: true }),
      page.getByRole('button', { name: 'Background map', exact: true }),
      page.getByRole('combobox', { name: 'Base maps', exact: true }),
      page.getByRole('combobox', { name: 'Base map', exact: true })
    ];

    for (const opener of selectorOpeners) {
      if ((await opener.count()) === 0 || !(await opener.first().isVisible())) {
        continue;
      }

      const trigger = opener.first();
      const expanded = await trigger.getAttribute('aria-expanded');

      if (expanded !== 'true') {
        await trigger.click();
      }

      radioOptionsVisible =
        (await cartoLightRadio.count()) > 0 &&
        (await openStreetMapRadio.count()) > 0 &&
        (await cartoLightRadio.first().isVisible()) &&
        (await openStreetMapRadio.first().isVisible());

      menuOptionsVisible =
        (await cartoLightMenuItem.count()) > 0 &&
        (await openStreetMapMenuItem.count()) > 0 &&
        (await cartoLightMenuItem.first().isVisible()) &&
        (await openStreetMapMenuItem.first().isVisible());

      if (radioOptionsVisible || menuOptionsVisible) {
        break;
      }
    }
  }

  radioOptionsVisible =
    (await cartoLightRadio.count()) > 0 &&
    (await openStreetMapRadio.count()) > 0 &&
    (await cartoLightRadio.first().isVisible()) &&
    (await openStreetMapRadio.first().isVisible());

  menuOptionsVisible =
    (await cartoLightMenuItem.count()) > 0 &&
    (await openStreetMapMenuItem.count()) > 0 &&
    (await cartoLightMenuItem.first().isVisible()) &&
    (await openStreetMapMenuItem.first().isVisible());

  if (radioOptionsVisible) {
    await expect(cartoLightRadio).toBeVisible();
    await expect(openStreetMapRadio).toBeVisible();

    await expect(cartoLightRadio).toBeChecked();
    await expect(openStreetMapRadio).not.toBeChecked();

    await openStreetMapRadio.click({ force: true });

    await expect(openStreetMapRadio).toBeChecked();
    await expect(cartoLightRadio).not.toBeChecked();
    return;
  }

  await expect(cartoLightMenuItem).toBeVisible();
  await expect(openStreetMapMenuItem).toBeVisible();

  await expect(cartoLightMenuItem).toHaveAttribute('aria-checked', 'true');
  await expect(openStreetMapMenuItem).toHaveAttribute('aria-checked', 'false');

  await openStreetMapMenuItem.click();

  if (
    (await cartoLightMenuItem.count()) === 0 ||
    (await openStreetMapMenuItem.count()) === 0 ||
    !(await cartoLightMenuItem.first().isVisible()) ||
    !(await openStreetMapMenuItem.first().isVisible())
  ) {
    const selectorOpeners = [
      page.getByRole('button', { name: 'OpenStreetMap', exact: true }),
      page.getByRole('button', { name: 'Carto Light', exact: true }),
      page.getByRole('button', { name: 'Base maps', exact: true }),
      page.getByRole('button', { name: 'Basemaps', exact: true }),
      page.getByRole('button', { name: 'Base map', exact: true }),
      page.getByRole('button', { name: 'Background maps', exact: true }),
      page.getByRole('button', { name: 'Background map', exact: true }),
      page.getByRole('combobox', { name: 'Base maps', exact: true }),
      page.getByRole('combobox', { name: 'Base map', exact: true })
    ];

    for (const opener of selectorOpeners) {
      if ((await opener.count()) === 0 || !(await opener.first().isVisible())) {
        continue;
      }

      const trigger = opener.first();
      const expanded = await trigger.getAttribute('aria-expanded');

      if (expanded !== 'true') {
        await trigger.click();
      }

      if (
        (await cartoLightMenuItem.count()) > 0 &&
        (await openStreetMapMenuItem.count()) > 0 &&
        (await cartoLightMenuItem.first().isVisible()) &&
        (await openStreetMapMenuItem.first().isVisible())
      ) {
        break;
      }
    }
  }

  await expect(openStreetMapMenuItem).toBeVisible();
  await expect(cartoLightMenuItem).toBeVisible();
  await expect(openStreetMapMenuItem).toHaveAttribute('aria-checked', 'true');
  await expect(cartoLightMenuItem).toHaveAttribute('aria-checked', 'false');
});
