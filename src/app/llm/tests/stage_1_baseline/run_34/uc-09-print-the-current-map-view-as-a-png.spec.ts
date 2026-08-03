// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const printMapToggle = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapToggle).toBeVisible();

  const titleInput = page.getByRole('textbox', { name: /title/i });

  if (!(await titleInput.isVisible())) {
    const pressed = await printMapToggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapToggle.click();
    }
  }

  await expect(titleInput).toBeVisible();

  const printTitle = 'Use Case 9 PNG Export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  if (await pngRadio.isVisible()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatSelect = page.getByRole('combobox', { name: /format/i });
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });
    await expect(formatSelect).toHaveValue(/png/i);
  }

  const exportButton = page.getByRole('button', { name: 'Export', exact: true });
  const printButton = page.getByRole('button', { name: 'Print', exact: true });
  const actionButton = (await exportButton.isVisible()) ? exportButton : printButton;

  await expect(actionButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await actionButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  if (downloadPath) {
    const fileContent = await readFile(downloadPath);
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    expect(fileContent.subarray(0, 8).equals(pngSignature)).toBe(true);
    expect(fileContent.length).toBeGreaterThan(1000);
  }
});
