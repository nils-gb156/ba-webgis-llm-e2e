// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByRole('application', { name: 'webgis map' })).toBeVisible();

  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  const measurementButton = page
    .getByTestId('map-toolbar')
    .getByRole('button', { name: 'Measurement', exact: true });
  await expect(measurementButton).toBeVisible();

  const measurementPanelId = await measurementButton.getAttribute('aria-controls');
  const initialPressedState = await measurementButton.getAttribute('aria-pressed');

  if (initialPressedState !== 'true') {
    await measurementButton.click();
  }

  if (initialPressedState !== null) {
    await expect(measurementButton).toHaveAttribute('aria-pressed', 'true');
  }

  if (measurementPanelId) {
    await expect(page.locator(`#${measurementPanelId}`)).toBeVisible();
  } else {
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
    if (await measurementDialog.count()) {
      await expect(measurementDialog).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { name: 'Measurement', exact: true })).toBeVisible();
    }
  }

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const point1 = {
    x: Math.round(mapBox.width * 0.42),
    y: Math.round(mapBox.height * 0.35),
  };
  const point2 = {
    x: Math.round(mapBox.width * 0.52),
    y: Math.round(mapBox.height * 0.48),
  };
  const point3 = {
    x: Math.round(mapBox.width * 0.62),
    y: Math.round(mapBox.height * 0.6),
  };

  await mapContainer.click({ position: point1 });
  await mapContainer.click({ position: point2 });
  await mapContainer.dblclick({ position: point3 });

  const lengthWithUnit = /\b\d[\d.,]*\s?(?:mm|cm|m|km)\b/i;

  if (measurementPanelId) {
    await expect(page.locator(`#${measurementPanelId}`)).toContainText(lengthWithUnit);
  } else {
    const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
    if (await measurementDialog.count()) {
      await expect(measurementDialog).toContainText(lengthWithUnit);
    } else {
      await expect(page.getByText(lengthWithUnit)).toBeVisible();
    }
  }
});
