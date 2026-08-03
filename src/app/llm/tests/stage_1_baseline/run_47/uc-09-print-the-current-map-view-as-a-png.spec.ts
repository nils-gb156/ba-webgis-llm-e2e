// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const isVisible = async (locator: Locator): Promise<boolean> => {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  };

  const printToolbarButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printToolbarButton).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line');
  await expect(scaleBar).toBeVisible();

  const titleInput = page.getByRole('textbox', { name: /title/i });
  if (!(await isVisible(titleInput))) {
    await printToolbarButton.click();
  }

  await expect(titleInput).toBeVisible();

  const printTitle = `E2E PNG Print ${Date.now()}`;
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  const formatCombobox = page.getByRole('combobox', { name: /format/i });

  if (await isVisible(pngRadio)) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    await expect(formatCombobox).toBeVisible();
    try {
      await formatCombobox.selectOption({ label: 'PNG' });
    } catch {
      await formatCombobox.selectOption('png');
    }
    await expect.poll(async () => await formatCombobox.inputValue()).toMatch(/png/i);
  }

  let exportButton = page.getByRole('button', { name: /^Export$/ });
  if (!(await isVisible(exportButton))) {
    exportButton = page.getByRole('button', { name: /^Print$/ });
  }

  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  await expect.poll(() => download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  if (downloadPath) {
    const fileContent = await readFile(downloadPath);
    expect(fileContent.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(fileContent.length).toBeGreaterThan(1024);
  }
});
