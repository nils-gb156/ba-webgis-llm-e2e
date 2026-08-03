// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();
  await expect(scaleBar).toBeVisible();

  const titleInput = page.getByRole('textbox', { name: /title/i });
  if (!(await titleInput.isVisible())) {
    const isPressed = await printMapButton.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await printMapButton.click();
    }
  }

  await expect(titleInput).toBeVisible();

  const printTitle = 'E2E PNG Print Export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatSelect = page.getByRole('combobox', { name: /format/i });
    await expect(formatSelect).toBeVisible();

    const pngValue = await formatSelect.evaluate((element) => {
      const select = element as HTMLSelectElement;
      const option = Array.from(select.options).find(
        (entry) => /png/i.test(entry.label) || /png/i.test(entry.value)
      );
      return option?.value;
    });

    expect(pngValue).toBeTruthy();
    await formatSelect.selectOption(pngValue!);
    await expect.poll(() => formatSelect.inputValue()).toMatch(/png/i);
  }

  let exportButton = page.getByRole('button', { name: /^Export$/i });
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: /^Print$/i });
  }
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  const downloadFailure = await download.failure();
  expect(downloadFailure).toBeNull();

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileBuffer = await fs.readFile(downloadPath!);
  expect(fileBuffer.byteLength).toBeGreaterThan(1024);

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);
});
