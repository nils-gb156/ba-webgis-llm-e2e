// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const printMapToggle = page.getByRole('button', { name: 'Print Map', exact: true });
  const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });

  await expect(printMapToggle).toBeVisible();

  if (!(await printPanelHeading.isVisible().catch(() => false))) {
    const isPressed = await printMapToggle.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await printMapToggle.click();
    }
  }

  await expect(printPanelHeading).toBeVisible();

  const titleInput = page.getByRole('textbox', { name: /title/i });
  const printTitle = 'Use Case 9 PNG Export';

  await expect(titleInput).toBeVisible();
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngFormatRadio = page.getByRole('radio', { name: /^PNG$/i });
  await expect(pngFormatRadio).toBeVisible();
  await pngFormatRadio.click({ force: true });
  await expect(pngFormatRadio).toBeChecked();

  const exportButton = page.getByRole('button', { name: /^(Export|Print)$/i });
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileBuffer = await readFile(downloadPath!);
  expect([...fileBuffer.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const width = fileBuffer.readUInt32BE(16);
  const height = fileBuffer.readUInt32BE(20);

  expect(width).toBeGreaterThan(200);
  expect(height).toBeGreaterThan(200);
  expect(fileBuffer.length).toBeGreaterThan(10_000);
});
