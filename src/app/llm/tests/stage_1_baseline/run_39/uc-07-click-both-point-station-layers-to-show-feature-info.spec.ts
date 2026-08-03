// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const findFirstExisting = async (locators: any[]) => {
    for (const locator of locators) {
      if ((await locator.count()) > 0) {
        return locator.first();
      }
    }
    return undefined;
  };

  const ensureCheckboxCheckedIfPresent = async (name: string) => {
    const checkbox = await findFirstExisting([
      page.getByRole('checkbox', { name, exact: true }),
      page.getByRole('switch', { name, exact: true })
    ]);

    if (!checkbox) {
      return;
    }

    if (!(await checkbox.isChecked())) {
      await checkbox.click({ force: true });
    }

    await expect(checkbox).toBeChecked();
  };

  const ensureToggleNotPressedIfPresent = async (names: string[]) => {
    const toggle = await findFirstExisting(
      names.map((name) => page.getByRole('button', { name, exact: true }))
    );

    if (!toggle) {
      return;
    }

    const ariaPressed = await toggle.getAttribute('aria-pressed');
    if (ariaPressed === 'true') {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    }
  };

  await ensureCheckboxCheckedIfPresent('UV-Index Stations');
  await ensureCheckboxCheckedIfPresent('EUCOS Ground Stations');
  await ensureToggleNotPressedIfPresent(['Measure', 'Measurement', 'Measure distance', 'Measure area']);

  const map = (
    await findFirstExisting([
      page.getByTestId('map'),
      page.getByTestId('map-container'),
      page.getByTestId('map-view'),
      page.locator('.ol-viewport'),
      page.locator('canvas')
    ])
  )!;

  await expect(map).toBeVisible();

  const box = await map.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map bounding box is not available.');
  }

  await map.click({
    position: {
      x: Math.round(box.width / 2),
      y: Math.round(box.height / 2)
    }
  });

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
