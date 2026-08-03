// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }, testInfo) => {
  const isVisible = async (locator: ReturnType<typeof page.locator>) => {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  };

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('networkidle');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();
  await expect(scaleBar).toBeVisible();

  const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });
  const titleInput = page.getByRole('textbox', { name: /title/i });

  if (!(await isVisible(printPanelHeading)) && !(await isVisible(titleInput))) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapButton.click();
    }
  }

  if (await printPanelHeading.count()) {
    await expect(printPanelHeading).toBeVisible();
  }
  await expect(titleInput).toBeVisible();

  const printTitle = 'Playwright PNG map export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
  const formatSelect = page.getByRole('combobox', { name: /format/i });

  if (await isVisible(pngRadio)) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });
    await expect(formatSelect).toHaveValue(/png/i);
  }

  const exportButton = page.getByRole('button', { name: /^(Export|Print|Download)$/i });
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect.poll(async () => download.failure()).toBeNull();

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  const savedFile = testInfo.outputPath(suggestedFilename);
  await download.saveAs(savedFile);

  const fileContent = await readFile(savedFile);
  expect(fileContent.byteLength).toBeGreaterThan(1000);
  expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
