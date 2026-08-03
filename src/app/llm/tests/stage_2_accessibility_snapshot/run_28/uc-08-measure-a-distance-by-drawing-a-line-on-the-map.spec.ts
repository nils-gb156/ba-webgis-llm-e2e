// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const mapToolbar = page.getByTestId('map-toolbar');
  const measurementButton = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(mapToolbar).toBeVisible();
  await expect(measurementButton).toBeVisible();

  const getMeasurementPanel = async () => {
    const panelId = await measurementButton.getAttribute('aria-controls');
    return panelId ? page.locator(`[id="${panelId}"]`) : null;
  };

  const isMeasurementPanelVisible = async () => {
    const panel = await getMeasurementPanel();
    if (panel && (await panel.isVisible().catch(() => false))) {
      return true;
    }

    const expanded = await measurementButton.getAttribute('aria-expanded');
    if (expanded === 'true') {
      return true;
    }

    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed === 'true') {
      return true;
    }

    return await page
      .getByRole('heading', { name: /measurement/i })
      .isVisible()
      .catch(() => false);
  };

  if (!(await isMeasurementPanelVisible())) {
    await measurementButton.click();
  }

  await expect.poll(isMeasurementPanelVisible).toBe(true);

  const measurementPanel = await getMeasurementPanel();
  if (measurementPanel) {
    await expect(measurementPanel).toBeVisible();
  }

  const box = await mapContainer.boundingBox();
  expect(box).not.toBeNull();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const points = [
    { x: Math.round(box.width * 0.62), y: Math.round(box.height * 0.34) },
    { x: Math.round(box.width * 0.72), y: Math.round(box.height * 0.43) },
    { x: Math.round(box.width * 0.79), y: Math.round(box.height * 0.53) },
    { x: Math.round(box.width * 0.86), y: Math.round(box.height * 0.61) }
  ];

  await mapContainer.click({ position: points[0] });
  await mapContainer.click({ position: points[1] });
  await mapContainer.click({ position: points[2] });
  await mapContainer.dblclick({ position: points[3] });

  const lengthPattern = /\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i;

  await expect
    .poll(async () => {
      const panel = await getMeasurementPanel();
      if (panel && (await panel.isVisible().catch(() => false))) {
        const panelText = (await panel.textContent()) ?? '';
        if (lengthPattern.test(panelText)) {
          return panelText;
        }
      }

      return (await page.locator('body').textContent()) ?? '';
    })
    .toMatch(lengthPattern);
});
