// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('footer')).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(page.getByTestId('scale-viewer')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();
  await printToggle.click();

  const printTitle = 'Use Case 9 PNG Export';

  let titleInput = page.getByLabel(/title/i).first();
  if (!(await titleInput.isVisible())) {
    titleInput = page.getByPlaceholder(/title/i).first();
  }
  if (!(await titleInput.isVisible())) {
    titleInput = page.getByRole('textbox').nth(1);
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill(printTitle);

  let formatCombobox = page.getByRole('combobox', { name: /format/i }).first();
  if (!(await formatCombobox.isVisible())) {
    formatCombobox = page.getByLabel(/format/i).first();
  }
  if (!(await formatCombobox.isVisible())) {
    formatCombobox = page.getByRole('combobox').nth(1);
  }

  if (await formatCombobox.isVisible()) {
    await expect(formatCombobox).toBeVisible();
    try {
      await formatCombobox.selectOption({ label: 'PNG' });
    } catch {
      try {
        await formatCombobox.selectOption('PNG');
      } catch {
        await formatCombobox.selectOption('png');
      }
    }
    await expect(formatCombobox).toHaveValue(/png/i);
  } else {
    const pngRadio = page.getByRole('radio', { name: /png/i }).first();
    await expect(pngRadio).toBeVisible();
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  }

  let exportButton = page.getByRole('button', { name: /^Export$/ }).first();
  if (!(await exportButton.isVisible())) {
    exportButton = page.getByRole('button', { name: /export/i }).first();
  }
  if (!(await exportButton.isVisible())) {
    exportButton = page.getByRole('button', { name: /^Download$/ }).first();
  }
  if (!(await exportButton.isVisible())) {
    exportButton = page.getByRole('button', { name: /download/i }).first();
  }
  if (!(await exportButton.isVisible())) {
    exportButton = page.getByRole('button', { name: /^Print$/ }).first();
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/i);
  expect(await download.failure()).toBeNull();

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  if (!downloadPath) {
    throw new Error('Expected a downloaded PNG file, but no download path was available.');
  }

  const fileContent = await readFile(downloadPath);
  expect(fileContent.length).toBeGreaterThan(1024);
  expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
  await expect(page.getByTestId('scale-bar')).toBeVisible();
});
