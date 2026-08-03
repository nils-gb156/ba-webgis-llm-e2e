// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const titleByLabel = page.getByLabel(/title/i).first();
  const titleByRole = page.getByRole('textbox', { name: /title/i }).first();
  const titleByPlaceholder = page.getByPlaceholder(/title/i).first();

  const isPrintPanelVisible = async () =>
    (await titleByLabel.isVisible()) ||
    (await titleByRole.isVisible()) ||
    (await titleByPlaceholder.isVisible());

  if (!(await isPrintPanelVisible())) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapButton.click();
    }
  }

  await expect.poll(isPrintPanelVisible).toBe(true);

  let titleInput = titleByLabel;
  if (await titleByLabel.count()) {
    titleInput = titleByLabel;
  } else if (await titleByRole.count()) {
    titleInput = titleByRole;
  } else {
    titleInput = titleByPlaceholder;
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill('Current map view PNG export');
  await expect(titleInput).toHaveValue('Current map view PNG export');

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true }).first();
  const formatCombobox = page.getByRole('combobox', { name: /format/i }).first();
  const pngFormatButton = page.getByRole('button', { name: 'PNG', exact: true }).first();

  if (await pngRadio.isVisible()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else if (await formatCombobox.isVisible()) {
    try {
      await formatCombobox.selectOption({ label: 'PNG' });
    } catch {
      try {
        await formatCombobox.selectOption({ value: 'png' });
      } catch {
        await formatCombobox.click();
        const popupPngOption = page.getByRole('option', { name: 'PNG', exact: true }).first();
        await expect(popupPngOption).toBeVisible();
        await popupPngOption.click();
      }
    }

    await expect.poll(async () => {
      try {
        return await formatCombobox.inputValue();
      } catch {
        return '';
      }
    }).toMatch(/png/i);
  } else {
    await expect(pngFormatButton).toBeVisible();
    await pngFormatButton.click();
  }

  const exportButton = page
    .getByRole('button', { name: 'Export', exact: true })
    .or(page.getByRole('button', { name: 'Print', exact: true }))
    .first();

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect.poll(async () => await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  if (downloadPath) {
    const buffer = await readFile(downloadPath);
    expect(buffer.length).toBeGreaterThan(1024);
    expect(Array.from(buffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    const ihdrIndex = buffer.indexOf('IHDR', 0, 'ascii');
    const idatIndex = buffer.indexOf('IDAT', 0, 'ascii');
    const iendIndex = buffer.indexOf('IEND', 0, 'ascii');

    expect(ihdrIndex).toBeGreaterThan(0);
    expect(idatIndex).toBeGreaterThan(0);
    expect(iendIndex).toBeGreaterThan(0);

    const width = buffer.readUInt32BE(ihdrIndex + 4);
    const height = buffer.readUInt32BE(ihdrIndex + 8);

    expect(width).toBeGreaterThan(100);
    expect(height).toBeGreaterThan(100);
  }
});
