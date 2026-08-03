// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const measurementButton = page.getByTestId('measurement-toggle');
  const mapContainer = page.getByTestId('map-container');
  const measurementHeading = page.getByRole('heading', {
    name: 'Measurement',
    exact: true
  });
  const measurementDialog = page.getByRole('dialog', {
    name: 'Measurement',
    exact: true
  });

  await expect(measurementButton).toBeVisible();
  await expect(mapContainer).toBeVisible();

  const panelVisibleBeforeClick =
    (await measurementHeading.isVisible()) || (await measurementDialog.isVisible());

  if (!panelVisibleBeforeClick) {
    await measurementButton.click();
  }

  await expect
    .poll(async () => {
      return (await measurementHeading.isVisible()) || (await measurementDialog.isVisible());
    })
    .toBe(true);

  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container has no bounding box.');
  }

  const firstPoint = {
    x: Math.round(mapBox.width * 0.55),
    y: Math.round(mapBox.height * 0.65)
  };
  const secondPoint = {
    x: Math.round(mapBox.width * 0.65),
    y: Math.round(mapBox.height * 0.55)
  };
  const thirdPoint = {
    x: Math.round(mapBox.width * 0.75),
    y: Math.round(mapBox.height * 0.45)
  };

  await mapContainer.click({ position: firstPoint });
  await mapContainer.click({ position: secondPoint });
  await mapContainer.dblclick({ position: thirdPoint });

  await expect
    .poll(async () => {
      const lengthFields = page.getByLabel(/Length/i);
      if ((await lengthFields.count()) > 0) {
        const field = lengthFields.first();
        if (await field.isVisible()) {
          const tagName = await field.evaluate((element) => element.tagName.toLowerCase());
          const value =
            tagName === 'input' || tagName === 'textarea'
              ? await field.inputValue()
              : ((await field.textContent()) ?? '');
          return `Length ${value}`;
        }
      }

      if (await measurementDialog.isVisible()) {
        return (await measurementDialog.textContent()) ?? '';
      }

      if (await measurementHeading.isVisible()) {
        const text = await measurementHeading.evaluate((element) => {
          const parentText = element.parentElement?.textContent ?? '';
          const grandParentText = element.parentElement?.parentElement?.textContent ?? '';
          return grandParentText.length > parentText.length ? grandParentText : parentText;
        });
        return /Length/i.test(text) ? text : '';
      }

      return '';
    })
    .toMatch(/Length[\s\S]*\b\d+(?:[.,]\d+)?\s?(?:m|km)\b/i);
});
