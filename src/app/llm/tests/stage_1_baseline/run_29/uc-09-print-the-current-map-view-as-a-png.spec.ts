// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }, testInfo) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();
  await expect(scaleBar).toBeVisible();

  const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });
  if (!(await printPanelHeading.isVisible())) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapButton.click();
    }
  }

  await expect(printPanelHeading).toBeVisible();

  const titleInput = page.getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Use Case 9 PNG export');
  await expect(titleInput).toHaveValue('Use Case 9 PNG export');

  const pngFormatRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  await expect(pngFormatRadio).toBeVisible();
  await pngFormatRadio.click({ force: true });
  await expect(pngFormatRadio).toBeChecked();

  const downloadPromise = page.waitForEvent('download');
  const exportButton = page.getByRole('button', { name: /^(Export|Print)$/ });
  await expect(exportButton).toBeVisible();
  await exportButton.click();

  const download = await downloadPromise;
  await expect(await download.failure()).toBeNull();

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  const downloadPath = testInfo.outputPath(suggestedFilename);
  await download.saveAs(downloadPath);

  const fileBytes = await readFile(downloadPath);
  expect(fileBytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(fileBytes.byteLength).toBeGreaterThan(1000);
});
