// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  await expect(page.locator('canvas').first()).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line').first();
  await expect(scaleBar).toBeVisible();
  await expect(scaleBar).toContainText(/\S+/);

  const printMapHeading = page.getByRole('heading', { name: 'Print Map', exact: true });
  let printPanel = page.getByRole('dialog', { name: 'Print Map', exact: true });

  if (!(await printPanel.isVisible())) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapButton.click();
    }
  }

  if (!(await printPanel.isVisible())) {
    const fallbackDialog = page.getByRole('dialog').filter({ has: printMapHeading }).first();
    if ((await fallbackDialog.count()) > 0) {
      printPanel = fallbackDialog;
    }
  }

  if (!(await printPanel.isVisible())) {
    const fallbackRegion = page.getByRole('region').filter({ has: printMapHeading }).first();
    if ((await fallbackRegion.count()) > 0) {
      printPanel = fallbackRegion;
    }
  }

  await expect(printMapHeading).toBeVisible();
  if ((await printPanel.count()) > 0) {
    await expect(printPanel).toBeVisible();
  }

  const panelScope = (await printPanel.count()) > 0 ? printPanel : page.locator('body');

  let titleInput = panelScope.getByLabel('Title', { exact: true });
  if ((await titleInput.count()) === 0) {
    titleInput = panelScope.getByRole('textbox', { name: 'Title', exact: true });
  }
  if ((await titleInput.count()) === 0) {
    titleInput = panelScope.getByRole('textbox').first();
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill('Current Map View');

  const pngRadio = panelScope.getByRole('radio', { name: 'PNG', exact: true });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    let formatSelect = panelScope.getByRole('combobox', { name: /format/i });
    if ((await formatSelect.count()) === 0) {
      formatSelect = panelScope.getByRole('combobox').first();
    }

    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });
    await expect(formatSelect).toHaveValue(/png/i);
  }

  let exportButton = panelScope.getByRole('button', { name: /^(Export|Print|Create Print File)$/i });
  if ((await exportButton.count()) === 0) {
    exportButton = panelScope.getByRole('button', { name: /download/i });
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();

  const chunks: Buffer[] = [];
  if (stream) {
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
  }

  const fileBuffer = Buffer.concat(chunks);
  expect(fileBuffer.byteLength).toBeGreaterThan(8);
  expect(fileBuffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
});
