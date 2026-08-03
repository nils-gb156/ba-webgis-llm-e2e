// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const ensureTogglePressed = async (candidateNames: string[], desiredPressed: 'true' | 'false') => {
    for (const name of candidateNames) {
      const button = page.getByRole('button', { name, exact: true }).first();
      if ((await button.count()) > 0) {
        const currentPressed = await button.getAttribute('aria-pressed');
        if (currentPressed !== null && currentPressed !== desiredPressed) {
          await button.click();
          await expect(button).toHaveAttribute('aria-pressed', desiredPressed);
        }
        return;
      }
    }
  };

  await ensureTogglePressed(['Information', 'Info'], 'true');
  await ensureTogglePressed(['Measurement', 'Measure', 'Distance Measurement', 'Area Measurement'], 'false');
  await ensureTogglePressed(['Layers', 'Map Layers', 'Layer List'], 'true');

  const uviLayerCheckboxes = page.getByRole('checkbox', { name: /^UV-Index Stations?$/ });
  const eucosLayerCheckboxes = page.getByRole('checkbox', { name: /^EUCOS Ground Stations?$/ });

  await expect.poll(async () => await uviLayerCheckboxes.count()).toBeGreaterThan(0);
  await expect.poll(async () => await eucosLayerCheckboxes.count()).toBeGreaterThan(0);

  const uviLayerCheckbox = uviLayerCheckboxes.first();
  const eucosLayerCheckbox = eucosLayerCheckboxes.first();

  if (!(await uviLayerCheckbox.isChecked())) {
    await uviLayerCheckbox.click({ force: true });
    await expect(uviLayerCheckbox).toBeChecked();
  }

  if (!(await eucosLayerCheckbox.isChecked())) {
    await eucosLayerCheckbox.click({ force: true });
    await expect(eucosLayerCheckbox).toBeChecked();
  }

  const canvases = page.locator('canvas');
  await expect.poll(async () => await canvases.count()).toBeGreaterThan(0);

  const largestCanvasIndex = await canvases.evaluateAll((elements) => {
    let bestIndex = -1;
    let bestArea = -1;

    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const area = rect.width * rect.height;

      if (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        area > bestArea
      ) {
        bestArea = area;
        bestIndex = index;
      }
    });

    return bestIndex;
  });

  if (largestCanvasIndex === -1) {
    throw new Error('No visible map canvas found.');
  }

  const mapCanvas = canvases.nth(largestCanvasIndex);
  await expect(mapCanvas).toBeVisible();

  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas bounding box is not available.');
  }

  await mapCanvas.click({
    position: {
      x: Math.round(box.width / 2),
      y: Math.round(box.height / 2)
    },
    force: true
  });

  const uviInfoSection = page.getByText(/^UV-Index Station$/, { exact: true }).first();
  const eucosInfoSection = page.getByText(/^EUCOS Ground Station$/, { exact: true }).first();

  await expect(uviInfoSection).toBeVisible();
  await expect(eucosInfoSection).toBeVisible();
});
