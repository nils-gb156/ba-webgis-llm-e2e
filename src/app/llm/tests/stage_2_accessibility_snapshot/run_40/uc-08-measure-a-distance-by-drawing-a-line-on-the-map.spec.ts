// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByRole('application', { name: 'webgis map', exact: true })).toBeVisible();

  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  const measurementButton = page.getByTestId('measurement-toggle');
  await expect(measurementButton).toBeVisible();

  const isMeasurementOpen = async () => {
    const ariaPressed = await measurementButton.getAttribute('aria-pressed');
    const ariaExpanded = await measurementButton.getAttribute('aria-expanded');
    return ariaPressed === 'true' || ariaExpanded === 'true';
  };

  if (!(await isMeasurementOpen())) {
    await measurementButton.click();
  }

  await expect.poll(isMeasurementOpen).toBe(true);

  const controlledPanelId = await measurementButton.getAttribute('aria-controls');
  if (controlledPanelId) {
    await expect(page.locator(`[id="${controlledPanelId}"]`)).toBeVisible();
  } else if ((await page.getByRole('dialog').count()) > 0) {
    await expect(page.getByRole('dialog').first()).toBeVisible();
  }

  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container has no bounding box.');
  }

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const positions = [
    {
      x: clamp(Math.round(box.width * 0.45), 40, Math.round(box.width - 40)),
      y: clamp(Math.round(box.height * 0.40), 40, Math.round(box.height - 40))
    },
    {
      x: clamp(Math.round(box.width * 0.55), 40, Math.round(box.width - 40)),
      y: clamp(Math.round(box.height * 0.50), 40, Math.round(box.height - 40))
    },
    {
      x: clamp(Math.round(box.width * 0.65), 40, Math.round(box.width - 40)),
      y: clamp(Math.round(box.height * 0.60), 40, Math.round(box.height - 40))
    }
  ];

  await mapContainer.click({ position: positions[0] });
  await mapContainer.click({ position: positions[1] });
  await mapContainer.dblclick({ position: positions[2] });

  const lengthPattern = /\b\d[\d\s.,]*\s?(?:m|km)\b/i;

  if (controlledPanelId) {
    await expect(page.locator(`[id="${controlledPanelId}"]`).getByText(lengthPattern).first()).toBeVisible();
  } else if ((await page.getByRole('dialog').count()) > 0) {
    await expect(page.getByRole('dialog').first().getByText(lengthPattern).first()).toBeVisible();
  } else {
    await expect(page.getByText(lengthPattern).first()).toBeVisible();
  }
});
