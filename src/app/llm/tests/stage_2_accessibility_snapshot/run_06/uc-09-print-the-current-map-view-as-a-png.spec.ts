// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('print-toggle')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  const titleByRole = page.getByRole('textbox', { name: /title/i }).first();
  const titleByLabel = page.getByLabel(/title/i).first();
  const titleByPlaceholder = page.getByPlaceholder(/title/i).first();

  const printPanelAlreadyVisible =
    ((await titleByRole.count()) > 0 && (await titleByRole.isVisible())) ||
    ((await titleByLabel.count()) > 0 && (await titleByLabel.isVisible())) ||
    ((await titleByPlaceholder.count()) > 0 && (await titleByPlaceholder.isVisible()));

  if (!printPanelAlreadyVisible) {
    const pressed = await printToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printToggle.click();
    }
  }

  await expect.poll(async () => {
    return (
      (await titleByRole.count()) +
      (await titleByLabel.count()) +
      (await titleByPlaceholder.count())
    );
  }).toBeGreaterThan(0);

  const titleInput =
    (await titleByRole.count()) > 0
      ? titleByRole
      : (await titleByLabel.count()) > 0
        ? titleByLabel
        : titleByPlaceholder;

  await expect(titleInput).toBeVisible();
  await titleInput.fill('Playwright PNG export');

  const pngRadio = page.getByRole('radio', { name: /^PNG$/i }).first();
  if ((await pngRadio.count()) > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatByRole = page.getByRole('combobox', { name: /format/i }).first();
    const formatByLabel = page.getByLabel(/format/i).first();
    const formatSelect = (await formatByRole.count()) > 0 ? formatByRole : formatByLabel;

    await expect(formatSelect).toBeVisible();

    try {
      await formatSelect.selectOption({ label: 'PNG' });
    } catch {
      try {
        await formatSelect.selectOption('png');
      } catch {
        await formatSelect.selectOption('image/png');
      }
    }

    await expect.poll(async () => (await formatSelect.inputValue()).toLowerCase()).toMatch(/png/);
  }

  const exportByExport = page.getByRole('button', { name: /^Export$/i }).first();
  const exportByPrint = page.getByRole('button', { name: /^Print$/i }).first();
  const exportByDownload = page.getByRole('button', { name: /^Download$/i }).first();
  const exportByGenerate = page.getByRole('button', { name: /^Generate$/i }).first();

  await expect.poll(async () => {
    return (
      (await exportByExport.count()) +
      (await exportByPrint.count()) +
      (await exportByDownload.count()) +
      (await exportByGenerate.count())
    );
  }).toBeGreaterThan(0);

  const exportButton =
    (await exportByExport.count()) > 0
      ? exportByExport
      : (await exportByPrint.count()) > 0
        ? exportByPrint
        : (await exportByDownload.count()) > 0
          ? exportByDownload
          : exportByGenerate;

  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect(await download.failure()).toBeNull();

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileBuffer = await fs.readFile(downloadPath!);
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);
  expect(fileBuffer.byteLength).toBeGreaterThan(1024);
});
