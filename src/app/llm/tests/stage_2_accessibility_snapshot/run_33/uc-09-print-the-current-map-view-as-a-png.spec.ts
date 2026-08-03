// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  const titleInput = page.getByRole('textbox', { name: /title/i });

  if (!(await titleInput.isVisible().catch(() => false))) {
    const pressed = await printToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printToggle.click();
    }
  }

  await expect(titleInput).toBeVisible();
  const printTitle = 'Current Weather Map';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
  if (await pngRadio.isVisible().catch(() => false)) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatCombobox = page.getByRole('combobox', { name: /format/i });
    if (await formatCombobox.isVisible().catch(() => false)) {
      await formatCombobox.click();

      const pngOption = page.getByRole('option', { name: /^PNG$/i });
      if (await pngOption.isVisible().catch(() => false)) {
        await pngOption.click();
      } else {
        try {
          await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
          await formatCombobox.selectOption('png');
        }
      }
    } else {
      const pngButton = page.getByRole('button', { name: /^PNG$/i });
      await expect(pngButton).toBeVisible();
      await pngButton.click();
    }
  }

  let exportButton = page.getByRole('button', { name: /^Export$/i });
  if (!(await exportButton.isVisible().catch(() => false))) {
    exportButton = page.getByRole('button', { name: /^Print$/i });
  }
  if (!(await exportButton.isVisible().catch(() => false))) {
    exportButton = page.getByRole('button', { name: /^Download$/i });
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect.poll(() => download.failure()).toBeNull();
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  if (downloadPath) {
    const file = await fs.readFile(downloadPath);
    expect(file.length).toBeGreaterThan(8);
    expect(
      file.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe(true);
  }
});
