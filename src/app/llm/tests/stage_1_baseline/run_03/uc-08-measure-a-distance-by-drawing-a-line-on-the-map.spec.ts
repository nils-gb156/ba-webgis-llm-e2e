// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const toolbar = page.getByRole('toolbar').first();
  await expect(toolbar).toBeVisible();

  const measurementButton = toolbar.getByRole('button', { name: 'Measurement', exact: true });
  await expect(measurementButton).toBeVisible();

  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const measurementPanelAlreadyVisible = await measurementHeading.isVisible().catch(() => false);

  if (!measurementPanelAlreadyVisible) {
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  await expect(measurementHeading).toBeVisible();

  let measurementScope = page.locator('body');
  for (const candidate of [
    page.getByRole('region', { name: 'Measurement', exact: true }),
    page.getByRole('dialog', { name: 'Measurement', exact: true }),
    page.getByRole('group', { name: 'Measurement', exact: true }),
    page.getByRole('complementary', { name: 'Measurement', exact: true })
  ]) {
    if (await candidate.isVisible().catch(() => false)) {
      measurementScope = candidate;
      break;
    }
  }

  const mapViewport = page.locator('.ol-viewport').first();
  await expect(mapViewport).toBeVisible();

  const mapBox = await mapViewport.boundingBox();
  if (!mapBox) {
    throw new Error('Map viewport bounding box is not available.');
  }

  const firstPoint = {
    x: Math.round(mapBox.width * 0.58),
    y: Math.round(mapBox.height * 0.35)
  };
  const secondPoint = {
    x: Math.round(mapBox.width * 0.70),
    y: Math.round(mapBox.height * 0.45)
  };
  const thirdPoint = {
    x: Math.round(mapBox.width * 0.82),
    y: Math.round(mapBox.height * 0.55)
  };

  await mapViewport.click({ position: firstPoint });
  await mapViewport.click({ position: secondPoint });
  await mapViewport.dblclick({ position: thirdPoint });

  await expect(
    measurementScope.getByText(/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i).first()
  ).toBeVisible();
});
