// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFile } from 'fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const firstVisible = async (candidates: Locator[]): Promise<Locator | null> => {
    for (const candidate of candidates) {
      if (await candidate.isVisible().catch(() => false)) {
        return candidate;
      }
    }
    return null;
  };

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line').first();
  await expect(scaleBar).toBeVisible();

  const printToolbarButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printToolbarButton).toBeVisible();

  const titleFieldOnPage = await firstVisible([
    page.getByRole('textbox', { name: /title/i }),
    page.getByLabel(/title/i)
  ]);

  if (!titleFieldOnPage) {
    const isPressed = await printToolbarButton.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await printToolbarButton.click();
    }
  }

  const printDialog = page.getByRole('dialog', { name: /print map|print/i });
  const printRegion = page.getByRole('region', { name: /print map|print/i });

  let printScope: Page | Locator = page;
  if (await printDialog.isVisible().catch(() => false)) {
    printScope = printDialog;
  } else if (await printRegion.isVisible().catch(() => false)) {
    printScope = printRegion;
  }

  const titleInput = await firstVisible([
    printScope.getByRole('textbox', { name: /title/i }),
    printScope.getByLabel(/title/i)
  ]);
  if (!titleInput) {
    throw new Error('Could not find the title input in the printing panel.');
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill('Playwright PNG Export');
  await expect(titleInput).toHaveValue('Playwright PNG Export');

  let pngSelected = false;

  const formatControl = await firstVisible([
    printScope.getByRole('combobox', { name: /format/i }),
    printScope.getByLabel(/format/i)
  ]);

  if (formatControl) {
    try {
      await formatControl.selectOption({ label: 'PNG' });
      pngSelected = true;
      await expect(formatControl).toHaveValue(/png/i).catch(() => {});
    } catch {
      await formatControl.click();
      const pngOption = await firstVisible([
        printScope.getByRole('option', { name: 'PNG', exact: true }),
        page.getByRole('option', { name: 'PNG', exact: true })
      ]);
      if (pngOption) {
        await pngOption.click();
        pngSelected = true;
      }
    }
  }

  if (!pngSelected) {
    const pngRadio = await firstVisible([
      printScope.getByRole('radio', { name: 'PNG', exact: true })
    ]);
    if (pngRadio) {
      await pngRadio.click({ force: true });
      await expect(pngRadio).toBeChecked();
      pngSelected = true;
    }
  }

  if (!pngSelected) {
    const pngButton = await firstVisible([
      printScope.getByRole('button', { name: 'PNG', exact: true })
    ]);
    if (pngButton) {
      await pngButton.click();
      pngSelected = true;
    }
  }

  expect(pngSelected).toBeTruthy();

  const exportButton = await firstVisible([
    printScope.getByRole('button', { name: 'Export', exact: true }),
    printScope.getByRole('button', { name: 'Print', exact: true })
  ]);
  if (!exportButton) {
    throw new Error('Could not find the export/print button in the printing panel.');
  }

  await expect(exportButton).toBeVisible();
  await expect(scaleBar).toBeVisible();
  await expect(mapCanvas).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  if (!downloadPath) {
    throw new Error('Download path is unavailable.');
  }

  const fileBuffer = await readFile(downloadPath);
  expect(fileBuffer.length).toBeGreaterThan(1024);
  expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  const width = fileBuffer.readUInt32BE(16);
  const height = fileBuffer.readUInt32BE(20);
  expect(width).toBeGreaterThan(100);
  expect(height).toBeGreaterThan(100);
});
