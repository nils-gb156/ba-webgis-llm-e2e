// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }, testInfo) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();
  await expect(scaleBar).toBeVisible();

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  let titleInput = page.getByRole('textbox', { name: /title/i });
  if ((await titleInput.count()) === 0) {
    titleInput = page.getByRole('textbox', { name: /file name/i });
  }

  if (!(await titleInput.isVisible())) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapButton.click();
    }
  }

  await expect(titleInput).toBeVisible();

  const printTitle = 'E2E PNG Print';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  if ((await pngRadio.count()) > 0) {
    await expect(pngRadio).toBeVisible();
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatSelect = page.getByRole('combobox', { name: /format/i });
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });
    await expect(formatSelect).toHaveValue(/png/i);
  }

  let exportButton = page.getByRole('button', { name: 'Export', exact: true });
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: 'Print', exact: true });
  }
  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  const downloadPath = testInfo.outputPath(suggestedFilename);
  await download.saveAs(downloadPath);

  const fileContent = await readFile(downloadPath);
  expect(fileContent.length).toBeGreaterThan(0);

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(fileContent.subarray(0, pngSignature.length).equals(pngSignature)).toBe(true);
});
