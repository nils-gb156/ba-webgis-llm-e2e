// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  await expect(measurementButton).toBeVisible();

  if (!(await measurementHeading.isVisible())) {
    const isPressed = (await measurementButton.getAttribute('aria-pressed')) === 'true';

    if (!isPressed) {
      await measurementButton.click();
    }
  }

  await expect(measurementHeading).toBeVisible();

  const regionPanel = page.getByRole('region', { name: 'Measurement', exact: true });
  const dialogPanel = page.getByRole('dialog', { name: 'Measurement', exact: true });
  const complementaryPanel = page.getByRole('complementary', { name: 'Measurement', exact: true });

  let measurementPanelRoot = page.locator('body');
  if ((await regionPanel.count()) > 0) {
    measurementPanelRoot = regionPanel;
  } else if ((await dialogPanel.count()) > 0) {
    measurementPanelRoot = dialogPanel;
  } else if ((await complementaryPanel.count()) > 0) {
    measurementPanelRoot = complementaryPanel;
  }

  const lengthValueRegex = /\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i;
  const initialLengthValueCount = await measurementPanelRoot.getByText(lengthValueRegex).count();

  const mapViewport = page.locator('.ol-viewport');
  await expect(mapViewport).toBeVisible();

  const mapBox = await mapViewport.boundingBox();
  expect(mapBox).not.toBeNull();

  if (!mapBox) {
    throw new Error('Map viewport has no bounding box.');
  }

  const points = [
    { x: Math.round(mapBox.width * 0.55), y: Math.round(mapBox.height * 0.35) },
    { x: Math.round(mapBox.width * 0.65), y: Math.round(mapBox.height * 0.45) },
    { x: Math.round(mapBox.width * 0.75), y: Math.round(mapBox.height * 0.55) },
    { x: Math.round(mapBox.width * 0.85), y: Math.round(mapBox.height * 0.65) }
  ];

  await mapViewport.click({ position: points[0] });
  await mapViewport.click({ position: points[1] });
  await mapViewport.click({ position: points[2] });
  await mapViewport.dblclick({ position: points[3] });

  await expect.poll(async () => {
    return await measurementPanelRoot.getByText(lengthValueRegex).count();
  }).toBeGreaterThan(initialLengthValueCount);

  await expect(measurementPanelRoot.getByText(lengthValueRegex).last()).toBeVisible();
});
