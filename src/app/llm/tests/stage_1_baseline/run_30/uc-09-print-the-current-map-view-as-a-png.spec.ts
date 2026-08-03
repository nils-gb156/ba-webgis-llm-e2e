// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }, testInfo) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();
  await expect(scaleBar).toBeVisible();

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const titleInput = page.getByLabel(/title/i);
  if (!(await titleInput.isVisible())) {
    const pressed = await printMapButton.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await printMapButton.click();
    }
  }

  await expect(titleInput).toBeVisible();

  const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });
  if (await printPanelHeading.count()) {
    await expect(printPanelHeading).toBeVisible();
  }

  const printTitle = 'E2E PNG export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const formatCombobox = page.getByRole('combobox', { name: /format/i });
  if (await formatCombobox.count()) {
    await expect(formatCombobox).toBeVisible();
    const optionTexts = (await formatCombobox.locator('option').allTextContents())
      .map((text) => text.trim())
      .filter(Boolean);
    const pngOptionText = optionTexts.find((text) => /png/i.test(text));
    expect(pngOptionText).toBeTruthy();
    await formatCombobox.selectOption({ label: pngOptionText! });
    await expect.poll(async () => {
      return await formatCombobox.evaluate((element) => {
        const select = element as HTMLSelectElement;
        return select.selectedOptions[0]?.textContent?.trim() ?? '';
      });
    }).toMatch(/png/i);
  } else {
    const formatField = page.getByLabel(/format/i);
    if (await formatField.count()) {
      await expect(formatField).toBeVisible();
      const optionTexts = (await formatField.locator('option').allTextContents())
        .map((text) => text.trim())
        .filter(Boolean);
      const pngOptionText = optionTexts.find((text) => /png/i.test(text));
      expect(pngOptionText).toBeTruthy();
      await formatField.selectOption({ label: pngOptionText! });
      await expect.poll(async () => {
        return await formatField.evaluate((element) => {
          const select = element as HTMLSelectElement;
          return select.selectedOptions[0]?.textContent?.trim() ?? '';
        });
      }).toMatch(/png/i);
    } else {
      const pngRadio = page.getByRole('radio', { name: /png/i });
      await expect(pngRadio).toBeVisible();
      await pngRadio.click({ force: true });
      await expect(pngRadio).toBeChecked();
    }
  }

  const exportButton = page.getByRole('button', { name: /^(Export|Print)$/i }).first();
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  const downloadedFilePath = testInfo.outputPath(suggestedFilename);
  await download.saveAs(downloadedFilePath);

  const fileContent = await readFile(downloadedFilePath);
  expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(fileContent.length).toBeGreaterThan(1024);
});
