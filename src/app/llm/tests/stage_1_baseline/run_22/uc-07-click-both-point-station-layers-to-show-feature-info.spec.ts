// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const ensureLayerChecked = async (name: string) => {
    const checkbox = page.getByRole('checkbox', { name, exact: true });
    if ((await checkbox.count()) > 0) {
      if (!(await checkbox.isChecked())) {
        await checkbox.click({ force: true });
      }
      await expect(checkbox).toBeChecked();
    }
  };

  const deactivatePressedToggleIfPresent = async (name: string) => {
    const button = page.getByRole('button', { name, exact: true });
    if ((await button.count()) > 0) {
      const pressed = await button.first().getAttribute('aria-pressed');
      if (pressed === 'true') {
        await button.first().click();
        await expect(button.first()).toHaveAttribute('aria-pressed', 'false');
      }
    }
  };

  await deactivatePressedToggleIfPresent('Measure');
  await deactivatePressedToggleIfPresent('Measurement');

  await ensureLayerChecked('UV-Index Stations');
  await ensureLayerChecked('EUCOS Ground Stations');

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

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

  const uvIndexStationSection = page.getByRole('heading', {
    name: 'UV-Index Station',
    exact: true
  });
  const eucosGroundStationSection = page.getByRole('heading', {
    name: 'EUCOS Ground Station',
    exact: true
  });

  await expect(uvIndexStationSection).toBeVisible();
  await expect(eucosGroundStationSection).toBeVisible();
});
