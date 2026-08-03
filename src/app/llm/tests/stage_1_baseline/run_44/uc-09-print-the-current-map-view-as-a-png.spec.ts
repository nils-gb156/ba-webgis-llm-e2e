// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.locator('.ol-scale-line')).toBeVisible();

  const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });
  if (!(await printPanelHeading.isVisible())) {
    const isPressed = await printMapButton.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await printMapButton.click();
    }
  }

  await expect(printPanelHeading).toBeVisible();

  const titleInput = page.getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();

  const printTitle = `Playwright PNG export ${new Date().toISOString()}`;
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  let pngSelected = false;

  const pngRadio = page.getByRole('radio', { name: /^png$/i });
  if (await pngRadio.count()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
    pngSelected = true;
  }

  if (!pngSelected) {
    const formatSelect = page.getByRole('combobox', { name: /format/i });
    if (await formatSelect.count()) {
      await expect(formatSelect).toBeVisible();
      try {
        await formatSelect.selectOption({ label: 'PNG' });
      } catch {
        try {
          await formatSelect.selectOption('PNG');
        } catch {
          await formatSelect.selectOption('png');
        }
      }
      await expect(formatSelect).toHaveValue(/png/i);
      pngSelected = true;
    }
  }

  if (!pngSelected) {
    const pngButton = page.getByRole('button', { name: /^png$/i });
    if (await pngButton.count()) {
      await pngButton.first().click();
      const ariaPressed = await pngButton.first().getAttribute('aria-pressed');
      const ariaSelected = await pngButton.first().getAttribute('aria-selected');
      if (ariaPressed !== null) {
        expect(ariaPressed).toBe('true');
      }
      if (ariaSelected !== null) {
        expect(ariaSelected).toBe('true');
      }
      pngSelected = true;
    }
  }

  expect(pngSelected).toBe(true);

  const exportButtonCandidates = [
    page.getByRole('button', { name: /^export$/i }),
    page.getByRole('button', { name: /^print$/i }),
    page.getByRole('button', { name: /^download$/i }),
    page.getByRole('button', { name: /^create$/i })
  ];

  let exportButton = exportButtonCandidates[0];
  for (const candidate of exportButtonCandidates) {
    if (await candidate.count()) {
      exportButton = candidate.first();
      if (await exportButton.isVisible()) {
        break;
      }
    }
  }

  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  if (!downloadPath) {
    throw new Error('Download path is unavailable.');
  }

  const fileBuffer = await readFile(downloadPath);

  expect(fileBuffer.byteLength).toBeGreaterThan(1024);
  expect(fileBuffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);

  const width = fileBuffer.readUInt32BE(16);
  const height = fileBuffer.readUInt32BE(20);

  expect(width).toBeGreaterThan(100);
  expect(height).toBeGreaterThan(100);
});
