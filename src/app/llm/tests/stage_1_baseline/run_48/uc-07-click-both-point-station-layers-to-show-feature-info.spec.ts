// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('load');

  const layersToggle = page.getByRole('button', { name: 'Layers', exact: true });
  const uvLayerCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  const eucosLayerCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });

  if ((await uvLayerCheckbox.count()) === 0 && (await layersToggle.count()) > 0) {
    const pressed = await layersToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await layersToggle.click();
    }
  }

  if ((await uvLayerCheckbox.count()) > 0) {
    if (!(await uvLayerCheckbox.isChecked())) {
      await uvLayerCheckbox.click({ force: true });
    }
    await expect(uvLayerCheckbox).toBeChecked();
  }

  if ((await eucosLayerCheckbox.count()) > 0) {
    if (!(await eucosLayerCheckbox.isChecked())) {
      await eucosLayerCheckbox.click({ force: true });
    }
    await expect(eucosLayerCheckbox).toBeChecked();
  }

  const infoPanelHeading = page.getByRole('heading', { name: /^Info$/i });
  if ((await infoPanelHeading.count()) > 0) {
    await expect(infoPanelHeading).toBeVisible();
  }

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  const box = await mapViewport.boundingBox();
  if (!box) {
    throw new Error('Map viewport is not available.');
  }

  await mapViewport.click({
    position: {
      x: Math.round(box.width / 2),
      y: Math.round(box.height / 2)
    }
  });

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
