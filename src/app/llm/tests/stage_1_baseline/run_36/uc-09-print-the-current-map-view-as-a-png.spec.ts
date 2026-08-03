// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

test('UC9 - Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });

  await expect(printMapButton).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();
  await expect(scaleBar).toBeVisible();

  if (!(await printPanelHeading.isVisible())) {
    await printMapButton.click();
  }

  await expect(printPanelHeading).toBeVisible();

  const titleInput = page.getByLabel(/^Title$/i);
  await expect(titleInput).toBeVisible();
  await titleInput.fill('E2E PNG Export');

  const formatSelect = page.getByLabel(/format/i);
  await expect(formatSelect).toBeVisible();
  await formatSelect.selectOption({ label: 'PNG' });
  await expect(formatSelect).toHaveValue(/png/i);

  const exportButton = page.getByRole('button', { name: /^(Export|Print)$/i });
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  const targetPath = path.join(os.tmpdir(), `uc9-${Date.now()}-${suggestedFilename}`);
  await download.saveAs(targetPath);

  const fileBuffer = await fs.readFile(targetPath);
  expect(fileBuffer.length).toBeGreaterThan(1000);

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);

  const ihdrChunkType = fileBuffer.subarray(12, 16).toString('ascii');
  expect(ihdrChunkType).toBe('IHDR');

  const width = fileBuffer.readUInt32BE(16);
  const height = fileBuffer.readUInt32BE(20);
  expect(width).toBeGreaterThan(100);
  expect(height).toBeGreaterThan(100);
});
