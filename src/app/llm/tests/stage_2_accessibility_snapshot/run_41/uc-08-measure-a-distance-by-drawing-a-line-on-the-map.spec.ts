// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const mapContainer = page.getByTestId('map-container');
  const measurementToggle = page.getByTestId('measurement-toggle');

  await expect(mapContainer).toBeVisible();
  await expect(measurementToggle).toBeVisible();

  const measurementTogglePressed = await measurementToggle.getAttribute('aria-pressed');
  if (measurementTogglePressed !== 'true') {
    await measurementToggle.click();
  }

  await expect(measurementToggle).toHaveAttribute('aria-pressed', 'true');

  await expect
    .poll(async () => {
      const panelCandidates = [
        page.getByRole('heading', { name: /Measurement/i }),
        page.getByRole('dialog', { name: /Measurement/i }),
        page.getByRole('region', { name: /Measurement/i }),
        page.getByRole('group', { name: /Measurement/i })
      ];

      for (const candidate of panelCandidates) {
        if (await candidate.isVisible()) {
          return true;
        }
      }

      const measurementTexts = await page.getByText('Measurement', { exact: true }).all();
      let visibleCount = 0;
      for (const text of measurementTexts) {
        if (await text.isVisible()) {
          visibleCount += 1;
        }
      }

      return visibleCount > 1;
    })
    .toBe(true);

  const mapBox = await mapContainer.boundingBox();
  expect(mapBox).not.toBeNull();

  const width = mapBox!.width;
  const height = mapBox!.height;

  const firstPoint = {
    x: Math.round(width * 0.55),
    y: Math.round(height * 0.4)
  };
  const secondPoint = {
    x: Math.round(width * 0.65),
    y: Math.round(height * 0.46)
  };
  const thirdPoint = {
    x: Math.round(width * 0.75),
    y: Math.round(height * 0.52)
  };

  await mapContainer.click({ position: firstPoint });
  await mapContainer.click({ position: secondPoint });
  await mapContainer.dblclick({ position: thirdPoint });

  const lengthValue = page.getByText(/\b\d+(?:[.,]\d+)?\s?(?:km|m)\b/).first();
  await expect(lengthValue).toBeVisible();
});
