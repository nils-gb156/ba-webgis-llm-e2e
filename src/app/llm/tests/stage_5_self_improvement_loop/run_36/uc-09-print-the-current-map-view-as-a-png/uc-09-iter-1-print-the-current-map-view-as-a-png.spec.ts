// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(page.getByTestId('print-toggle')).toBeVisible();

  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  const printToggle = page.getByTestId('print-toggle');
  const printPanel = page.getByTestId('printing-panel');
  const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });

  if ((await printToggle.getAttribute('aria-pressed')) !== 'true') {
    await printToggle.click();
  }

  await expect(printToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(printPanel).toBeVisible();
  await expect(printDialog).toBeVisible();

  const titleInput = printDialog.getByRole('textbox', { name: 'Title', exact: true });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Playwright PNG export');
  await expect(titleInput).toHaveValue('Playwright PNG export');

  const formatSelect = printDialog.getByRole('combobox', { name: 'File format', exact: true });
  await expect(formatSelect).toBeVisible();
  await formatSelect.selectOption({ label: 'PNG' });
  await expect
    .poll(async () =>
      formatSelect.evaluate((element) => {
        const select = element as HTMLSelectElement;
        return select.selectedOptions[0]?.textContent?.trim();
      })
    )
    .toBe('PNG');

  const exportButton = printDialog.getByRole('button', { name: 'Export map', exact: true });
  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toMatch(/\.png$/i);

  const downloadPath = test.info().outputPath('printed-map-view.png');
  await download.saveAs(downloadPath);

  const fileContent = await fs.readFile(downloadPath);
  expect(fileContent.length).toBeGreaterThan(1000);
  expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
