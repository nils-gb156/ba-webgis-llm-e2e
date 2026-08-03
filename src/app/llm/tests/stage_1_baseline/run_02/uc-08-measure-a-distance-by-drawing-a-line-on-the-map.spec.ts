// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const toolbar = page.getByRole('toolbar').first();
  await expect(toolbar).toBeVisible();

  const measurementButton = toolbar.getByRole('button', { name: 'Measurement', exact: true });
  await expect(measurementButton).toBeVisible();

  const measurementDialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
  const measurementRegion = page.getByRole('region', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });

  let measurementPanelVisible = false;
  if ((await measurementDialog.count()) > 0) {
    measurementPanelVisible = await measurementDialog.isVisible();
  }
  if (!measurementPanelVisible && (await measurementRegion.count()) > 0) {
    measurementPanelVisible = await measurementRegion.isVisible();
  }
  if (!measurementPanelVisible && (await measurementHeading.count()) > 0) {
    measurementPanelVisible = await measurementHeading.isVisible();
  }

  if (!measurementPanelVisible) {
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  let measurementPanel = measurementDialog;
  if ((await measurementDialog.count()) > 0) {
    await expect(measurementDialog).toBeVisible();
    measurementPanel = measurementDialog;
  } else if ((await measurementRegion.count()) > 0) {
    await expect(measurementRegion).toBeVisible();
    measurementPanel = measurementRegion;
  } else {
    await expect(measurementHeading).toBeVisible();
    measurementPanel = page
      .locator('aside, section, [role="dialog"], [role="region"]')
      .filter({ has: measurementHeading })
      .first();
  }

  const canvases = page.locator('canvas');
  const canvasCount = await canvases.count();
  expect(canvasCount).toBeGreaterThan(0);

  let mapCanvas = canvases.first();
  let largestArea = 0;

  for (let i = 0; i < canvasCount; i++) {
    const candidate = canvases.nth(i);
    const box = await candidate.boundingBox();
    if (!box) {
      continue;
    }

    const area = box.width * box.height;
    if (area > largestArea) {
      largestArea = area;
      mapCanvas = candidate;
    }
  }

  await expect(mapCanvas).toBeVisible();

  const mapBox = await mapCanvas.boundingBox();
  expect(mapBox).not.toBeNull();
  if (!mapBox) {
    throw new Error('Could not determine the map canvas size.');
  }

  const p1 = { x: Math.round(mapBox.width * 0.25), y: Math.round(mapBox.height * 0.35) };
  const p2 = { x: Math.round(mapBox.width * 0.4), y: Math.round(mapBox.height * 0.42) };
  const p3 = { x: Math.round(mapBox.width * 0.58), y: Math.round(mapBox.height * 0.5) };
  const p4 = { x: Math.round(mapBox.width * 0.72), y: Math.round(mapBox.height * 0.58) };

  await mapCanvas.click({ position: p1 });
  await mapCanvas.click({ position: p2 });
  await mapCanvas.click({ position: p3 });
  await mapCanvas.dblclick({ position: p4 });

  await expect(measurementPanel).toContainText(/\d+(?:[.,]\d+)?\s*(mm|cm|m|km)\b/i);
});
