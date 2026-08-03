// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const uvLayerCheckbox = page.getByRole('checkbox', { name: /UV-Index Stations?/i });
  if ((await uvLayerCheckbox.count()) > 0) {
    if (!(await uvLayerCheckbox.isChecked())) {
      await uvLayerCheckbox.click({ force: true });
    }
    await expect(uvLayerCheckbox).toBeChecked();
  }

  const eucosLayerCheckbox = page.getByRole('checkbox', { name: /EUCOS Ground Stations?/i });
  if ((await eucosLayerCheckbox.count()) > 0) {
    if (!(await eucosLayerCheckbox.isChecked())) {
      await eucosLayerCheckbox.click({ force: true });
    }
    await expect(eucosLayerCheckbox).toBeChecked();
  }

  const mapCanvas = page.locator('canvas').last();
  await expect(mapCanvas).toBeVisible();

  const mapBox = await mapCanvas.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Map canvas has no bounding box.');
  }

  await mapCanvas.click({
    position: {
      x: Math.round(mapBox.width / 2),
      y: Math.round(mapBox.height / 2)
    }
  });

  const uvSectionHeading = page.getByRole('heading', { name: 'UV-Index Station', exact: true });
  const uvSection =
    (await uvSectionHeading.count()) > 0
      ? uvSectionHeading
      : page.getByText('UV-Index Station', { exact: true });

  const eucosSectionHeading = page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true });
  const eucosSection =
    (await eucosSectionHeading.count()) > 0
      ? eucosSectionHeading
      : page.getByText('EUCOS Ground Station', { exact: true });

  await expect(uvSection).toBeVisible();
  await expect(eucosSection).toBeVisible();
});
