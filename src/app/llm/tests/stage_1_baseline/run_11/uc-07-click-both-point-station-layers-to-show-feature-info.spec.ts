// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const measureToggle = page.getByRole('button', { name: /measure/i }).first();
  if (await measureToggle.isVisible().catch(() => false)) {
    const pressed = await measureToggle.getAttribute('aria-pressed');
    if (pressed === 'true') {
      await measureToggle.click();
      await expect(measureToggle).toHaveAttribute('aria-pressed', 'false');
    }
  }

  const uvIndexLayer = page.getByRole('checkbox', { name: 'UV-Index Stations', exact: true });
  const eucosLayer = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });

  if (!(await uvIndexLayer.isVisible().catch(() => false)) || !(await eucosLayer.isVisible().catch(() => false))) {
    const layersToggle = page.getByRole('button', { name: /layers/i }).first();
    await expect(layersToggle).toBeVisible();
    const pressed = await layersToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await layersToggle.click();
    }
  }

  await expect(uvIndexLayer).toBeVisible();
  if (!(await uvIndexLayer.isChecked())) {
    await uvIndexLayer.click({ force: true });
  }
  await expect(uvIndexLayer).toBeChecked();

  await expect(eucosLayer).toBeVisible();
  if (!(await eucosLayer.isChecked())) {
    await eucosLayer.click({ force: true });
  }
  await expect(eucosLayer).toBeChecked();

  const infoToggle = page.getByRole('button', { name: /^info$/i }).first();
  if (await infoToggle.isVisible().catch(() => false)) {
    const pressed = await infoToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await infoToggle.click();
    }
  }

  const boundingBox = await mapCanvas.boundingBox();
  expect(boundingBox).not.toBeNull();

  const getFeatureInfoResponse = page
    .waitForResponse((response) => response.url().includes('GetFeatureInfo') && response.ok())
    .catch(() => null);

  await mapCanvas.click({
    position: {
      x: (boundingBox!.width / 2),
      y: (boundingBox!.height / 2)
    }
  });

  await getFeatureInfoResponse;

  await expect(page.getByText('UV-Index Station', { exact: true })).toBeVisible();
  await expect(page.getByText('EUCOS Ground Station', { exact: true })).toBeVisible();
});
