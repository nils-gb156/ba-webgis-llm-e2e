// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPanel = page.getByTestId('measurement-panel');
  const measurementContent = page.getByTestId('measurement');

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();
  await expect.poll(() => getMapZoomLevel(page)).not.toBeUndefined();

  if (!(await measurementPanel.isVisible())) {
    const isPressed = (await measurementToggle.getAttribute('aria-pressed')) === 'true';
    if (!isPressed) {
      await measurementToggle.click();
    }
  }

  await expect(measurementPanel).toBeVisible();
  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(measurementContent).toBeVisible();

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.55),
      y: Math.round(box.height * 0.35),
    },
  });
  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.65),
      y: Math.round(box.height * 0.45),
    },
  });
  await mapContainer.click({
    position: {
      x: Math.round(box.width * 0.75),
      y: Math.round(box.height * 0.55),
    },
  });
  await mapContainer.dblclick({
    position: {
      x: Math.round(box.width * 0.82),
      y: Math.round(box.height * 0.68),
    },
  });

  await expect.poll(async () => (await measurementContent.innerText()).trim()).toMatch(
    /\b\d+(?:[.,]\d+)?\s*(mm|cm|m|km)\b/i
  );
});
