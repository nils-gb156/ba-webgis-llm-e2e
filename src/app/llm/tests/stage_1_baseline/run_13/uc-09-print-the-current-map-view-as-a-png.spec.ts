// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const toolbar = page.getByRole('toolbar').first();
  await expect(toolbar).toBeVisible();

  const printMapButton = toolbar.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const panelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });
  if (!(await panelHeading.isVisible())) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapButton.click();
    }
  }
  await expect(panelHeading).toBeVisible();

  const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
  const printRegion = page.getByRole('region', { name: 'Print Map', exact: true });
  const panelScope = (await printDialog.isVisible()) ? printDialog : ((await printRegion.isVisible()) ? printRegion : page);

  let titleInput = panelScope.getByRole('textbox', { name: /title/i });
  if (!(await titleInput.isVisible())) {
    titleInput = panelScope.getByLabel(/title/i);
  }
  await expect(titleInput).toBeVisible();

  const printTitle = 'Use Case 9 PNG Export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = panelScope.getByRole('radio', { name: /^png$/i });
  if (await pngRadio.isVisible()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatSelect = panelScope.getByRole('combobox', { name: /format/i });
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });
    await expect(formatSelect).toHaveValue(/png/i);
  }

  let exportButton = panelScope.getByRole('button', { name: /^export$/i });
  if (!(await exportButton.isVisible())) {
    exportButton = panelScope.getByRole('button', { name: /^print$/i });
  }
  if (!(await exportButton.isVisible())) {
    exportButton = panelScope.getByRole('button', { name: /^download$/i });
  }
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  const targetPath = path.join(os.tmpdir(), `${Date.now()}-${suggestedFilename}`);
  await download.saveAs(targetPath);

  const fileBuffer = await fs.readFile(targetPath);
  expect(fileBuffer.length).toBeGreaterThan(1000);

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);

  const width = fileBuffer.readUInt32BE(16);
  const height = fileBuffer.readUInt32BE(20);
  expect(width).toBeGreaterThan(0);
  expect(height).toBeGreaterThan(0);
});
