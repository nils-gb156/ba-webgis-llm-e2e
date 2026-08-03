// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await expect(page).toHaveURL('http://localhost:5173/ba-webgis-llm-e2e/');

  const cartoRadio = page.getByRole('radio', { name: 'Carto Light', exact: true });
  const cartoMenuItem = page.getByRole('menuitemradio', { name: 'Carto Light', exact: true });
  const osmRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });
  const osmMenuItem = page.getByRole('menuitemradio', { name: 'OpenStreetMap', exact: true });

  const baseMapSelectorCandidates = [
    page.getByRole('button', { name: /^(base ?maps?|base ?map|basemap|background maps?|background map)$/i }).first(),
    page.getByRole('tab', { name: /^(base ?maps?|base ?map|basemap|background maps?|background map)$/i }).first()
  ];

  const baseMapOptionsVisible = async (): Promise<boolean> => {
    return (
      (await cartoRadio.isVisible()) ||
      (await cartoMenuItem.isVisible()) ||
      (await osmRadio.isVisible()) ||
      (await osmMenuItem.isVisible())
    );
  };

  const openBaseMapSelector = async (): Promise<void> => {
    if (await baseMapOptionsVisible()) {
      return;
    }

    let opened = false;
    for (const candidate of baseMapSelectorCandidates) {
      if (await candidate.isVisible()) {
        await candidate.click();
        opened = true;
        break;
      }
    }

    expect(opened).toBe(true);
    await expect.poll(async () => await baseMapOptionsVisible()).toBe(true);
  };

  const isCartoSelected = async (): Promise<boolean | undefined> => {
    if (await cartoRadio.isVisible()) {
      return await cartoRadio.isChecked();
    }
    if (await cartoMenuItem.isVisible()) {
      return (await cartoMenuItem.getAttribute('aria-checked')) === 'true';
    }
    return undefined;
  };

  const isOsmSelected = async (): Promise<boolean | undefined> => {
    if (await osmRadio.isVisible()) {
      return await osmRadio.isChecked();
    }
    if (await osmMenuItem.isVisible()) {
      return (await osmMenuItem.getAttribute('aria-checked')) === 'true';
    }
    return undefined;
  };

  await expect.poll(async () => {
    if (await baseMapOptionsVisible()) {
      return true;
    }
    for (const candidate of baseMapSelectorCandidates) {
      if (await candidate.isVisible()) {
        return true;
      }
    }
    return false;
  }).toBe(true);

  await openBaseMapSelector();

  await expect.poll(async () => await isCartoSelected()).toBe(true);

  if (await osmRadio.isVisible()) {
    await osmRadio.click({ force: true });
  } else {
    await expect(osmMenuItem).toBeVisible();
    await osmMenuItem.click();
  }

  await openBaseMapSelector();

  await expect.poll(async () => await isOsmSelected()).toBe(true);
  await expect.poll(async () => await isCartoSelected()).toBe(false);
});
