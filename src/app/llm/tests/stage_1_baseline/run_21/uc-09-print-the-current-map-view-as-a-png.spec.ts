// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { mkdtemp, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const titleInput = page.getByLabel(/title/i);
  const printPanelVisible = await titleInput.isVisible();

  if (!printPanelVisible) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapButton.click();
    }
  }

  await expect(titleInput).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleIndicator = page.locator('.ol-scale-line, .ol-scale-bar').first();
  await expect(scaleIndicator).toBeVisible();

  const printTitle = `E2E Print ${Date.now()}`;
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatSelect = page.getByRole('combobox', { name: /format/i });
    if ((await formatSelect.count()) === 0) {
      throw new Error('Could not locate a PNG format selector in the print panel.');
    }
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });
    await expect(formatSelect).toHaveValue(/png/i);
  }

  let exportButton = page.getByRole('button', { name: 'Export', exact: true });
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: 'Print', exact: true });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: 'Download', exact: true });
  }
  if ((await exportButton.count()) === 0) {
    throw new Error('Could not locate the export/print button in the print panel.');
  }

  await expect(exportButton.first()).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.first().click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  const tempDir = await mkdtemp(join(tmpdir(), 'playwright-print-'));
  const savedFile = join(tempDir, suggestedFilename);
  await download.saveAs(savedFile);

  const fileBytes = await readFile(savedFile);
  expect(fileBytes.length).toBeGreaterThan(8);
  expect(fileBytes.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
});
