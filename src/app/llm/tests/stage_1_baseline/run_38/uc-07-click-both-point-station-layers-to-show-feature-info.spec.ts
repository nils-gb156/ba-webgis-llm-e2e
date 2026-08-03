// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const measureButtons = page.getByRole('button', { name: /measure/i });
  if ((await measureButtons.count()) > 0) {
    const measureButton = measureButtons.first();
    if ((await measureButton.getAttribute('aria-pressed')) === 'true') {
      await measureButton.click();
      await expect(measureButton).toHaveAttribute('aria-pressed', 'false');
    }
  }

  const infoRegions = page.getByRole('region', { name: /info/i });
  if ((await infoRegions.count()) > 0) {
    await expect(infoRegions.first()).toBeVisible();
  } else {
    const infoButtons = page.getByRole('button', { name: /info/i });
    if ((await infoButtons.count()) > 0) {
      const infoButton = infoButtons.first();
      if ((await infoButton.getAttribute('aria-pressed')) === 'false') {
        await infoButton.click();
      }
    }
  }

  const layerCheckboxNames = ['UV-Index Stations', 'EUCOS Ground Stations'] as const;
  const layerButtons = page.getByRole('button', { name: /layers/i });

  for (const layerName of layerCheckboxNames) {
    let checkbox = page.getByRole('checkbox', { name: layerName, exact: true });

    if ((await checkbox.count()) === 0 && (await layerButtons.count()) > 0) {
      const layerButton = layerButtons.first();
      if ((await layerButton.getAttribute('aria-pressed')) === 'false') {
        await layerButton.click();
      }
      checkbox = page.getByRole('checkbox', { name: layerName, exact: true });
    }

    if ((await checkbox.count()) > 0) {
      const layerCheckbox = checkbox.first();
      if (!(await layerCheckbox.isChecked())) {
        await layerCheckbox.click({ force: true });
      }
      await expect(layerCheckbox).toBeChecked();
    }
  }

  const mapContainer = page.locator('.ol-viewport').first();
  const mapCanvas = page.locator('canvas').first();

  if ((await mapContainer.count()) > 0) {
    await expect(mapContainer).toBeVisible();
  } else {
    await expect(mapCanvas).toBeVisible();
  }

  const clickableMap = (await mapContainer.count()) > 0 ? mapContainer : mapCanvas;
  const mapBox = await clickableMap.boundingBox();
  expect(mapBox).not.toBeNull();

  await clickableMap.click({
    position: {
      x: mapBox!.width / 2,
      y: mapBox!.height / 2
    }
  });

  await expect(page.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
