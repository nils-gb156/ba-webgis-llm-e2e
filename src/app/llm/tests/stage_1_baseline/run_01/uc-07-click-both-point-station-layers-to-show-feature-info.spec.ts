// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const ensureToggleState = async (names: string[], desiredPressed: boolean) => {
    for (const name of names) {
      const button = page.getByRole('button', { name, exact: true }).first();
      if ((await button.count()) === 0 || !(await button.isVisible())) {
        continue;
      }

      const ariaPressed = await button.getAttribute('aria-pressed');
      if (ariaPressed === null) {
        continue;
      }

      const isPressed = ariaPressed === 'true';
      if (isPressed !== desiredPressed) {
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', desiredPressed ? 'true' : 'false');
      }
      return;
    }
  };

  const ensureCheckboxChecked = async (checkbox: any) => {
    await expect(checkbox).toBeVisible();
    if (!(await checkbox.isChecked())) {
      await checkbox.click({ force: true });
      await expect(checkbox).toBeChecked();
    }
  };

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  await ensureToggleState(['Measure', 'Measurement', 'Distance measurement'], false);

  const uviLayerCheckbox = page.getByRole('checkbox', { name: /UV-Index Stations?/i }).first();
  const eucosLayerCheckbox = page.getByRole('checkbox', { name: /EUCOS Ground Stations?/i }).first();

  if (!(await uviLayerCheckbox.isVisible()) || !(await eucosLayerCheckbox.isVisible())) {
    await ensureToggleState(['Layers', 'Layer list', 'Map contents'], true);
  }

  await ensureCheckboxChecked(uviLayerCheckbox);
  await ensureCheckboxChecked(eucosLayerCheckbox);

  const mapBox = await mapViewport.boundingBox();
  if (!mapBox) {
    throw new Error('Map viewport has no bounding box.');
  }

  await mapViewport.click({
    position: {
      x: Math.round(mapBox.width / 2),
      y: Math.round(mapBox.height / 2)
    }
  });

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
