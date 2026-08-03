// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const measurementButton = page.getByRole('button', { name: 'Measurement', exact: true });
  const measurementHeading = page.getByRole('heading', { name: 'Measurement', exact: true });
  const lengthPattern = /\b\d+(?:[.,]\d+)?\s*(m|km)\b/i;

  const getMeasurementScope = async () => {
    const dialog = page.getByRole('dialog', { name: 'Measurement', exact: true });
    if (await dialog.isVisible()) {
      return dialog;
    }

    const region = page.getByRole('region', { name: 'Measurement', exact: true });
    if (await region.isVisible()) {
      return region;
    }

    const complementary = page.getByRole('complementary', { name: 'Measurement', exact: true });
    if (await complementary.isVisible()) {
      return complementary;
    }

    return null;
  };

  const getVisibleLengthTexts = async () => {
    const scope = (await getMeasurementScope()) ?? page;
    return await scope.getByText(lengthPattern).evaluateAll((elements) =>
      elements
        .filter((element) => {
          const htmlElement = element as HTMLElement;
          return !!(htmlElement.offsetWidth || htmlElement.offsetHeight || htmlElement.getClientRects().length);
        })
        .map((element) => element.textContent?.trim() ?? '')
        .filter((text) => text.length > 0)
    );
  };

  await expect(measurementButton).toBeVisible();

  let panelVisible = false;
  const scopeBeforeOpen = await getMeasurementScope();
  if (scopeBeforeOpen) {
    panelVisible = await scopeBeforeOpen.isVisible();
  }
  if (!panelVisible) {
    panelVisible = await measurementHeading.isVisible();
  }

  if (!panelVisible) {
    const pressed = await measurementButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await measurementButton.click();
    }
  }

  const measurementScope = await getMeasurementScope();
  if (measurementScope) {
    await expect(measurementScope).toBeVisible();
  } else {
    await expect(measurementHeading).toBeVisible();
  }

  const initialLengthTexts = await getVisibleLengthTexts();

  const mapCanvas = page.locator('canvas').last();
  await expect(mapCanvas).toBeVisible();

  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas is not ready for interaction.');
  }

  const positions = [
    { x: Math.round(box.width * 0.6), y: Math.round(box.height * 0.3) },
    { x: Math.round(box.width * 0.7), y: Math.round(box.height * 0.42) },
    { x: Math.round(box.width * 0.8), y: Math.round(box.height * 0.5) },
    { x: Math.round(box.width * 0.88), y: Math.round(box.height * 0.58) }
  ];

  await mapCanvas.click({ position: positions[0] });
  await mapCanvas.click({ position: positions[1] });
  await mapCanvas.click({ position: positions[2] });
  await mapCanvas.dblclick({ position: positions[3] });

  await expect.poll(async () => {
    const lengthTexts = await getVisibleLengthTexts();
    return lengthTexts.find((text) => !initialLengthTexts.includes(text)) ?? '';
  }).toMatch(lengthPattern);
});
