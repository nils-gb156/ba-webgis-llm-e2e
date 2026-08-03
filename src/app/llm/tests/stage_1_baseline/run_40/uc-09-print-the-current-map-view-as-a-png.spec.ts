// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line, .ol-scale-bar').first();
  await expect(scaleBar).toBeVisible();

  const scaleBarInner = page.locator('.ol-scale-line-inner, .ol-scale-bar-inner').first();
  if (await scaleBarInner.isVisible()) {
    await expect(scaleBarInner).not.toHaveText(/^\s*$/);
  }

  const printDialog = page.getByRole('dialog', { name: 'Print Map', exact: true });
  const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });

  const printPanelAlreadyVisible =
    (await printDialog.isVisible()) || (await printPanelHeading.isVisible());

  if (!printPanelAlreadyVisible) {
    await printMapButton.click();
  }

  await expect
    .poll(async () => (await printDialog.isVisible()) || (await printPanelHeading.isVisible()))
    .toBe(true);

  const panelScope = (await printDialog.isVisible()) ? printDialog : page;

  const titleInputByLabel = panelScope.getByLabel(/title/i);
  const titleInput = (await titleInputByLabel.isVisible())
    ? titleInputByLabel
    : panelScope.getByRole('textbox', { name: /title/i });

  await expect(titleInput).toBeVisible();

  const printTitle = `Playwright PNG Export ${Date.now()}`;
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const formatField = panelScope.getByLabel(/format/i);
  if (await formatField.isVisible()) {
    try {
      await formatField.selectOption({ label: 'PNG' });
    } catch {
      try {
        await formatField.selectOption({ value: 'png' });
      } catch {
        await formatField.selectOption({ value: 'image/png' });
      }
    }
    await expect(formatField).toHaveValue(/png/i);
  } else {
    const pngRadio = panelScope.getByRole('radio', { name: 'PNG', exact: true });
    await expect(pngRadio).toBeVisible();
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  }

  let exportButton = panelScope.getByRole('button', { name: 'Export', exact: true });
  if (!(await exportButton.isVisible())) {
    exportButton = panelScope.getByRole('button', { name: 'Print', exact: true });
  }
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();

  const fileBuffer = await fs.readFile(downloadPath!);
  expect(fileBuffer.length).toBeGreaterThan(1024);

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);

  const width = fileBuffer.readUInt32BE(16);
  const height = fileBuffer.readUInt32BE(20);
  expect(width).toBeGreaterThan(100);
  expect(height).toBeGreaterThan(100);

  const imageAnalysis = await page.evaluate(
    async (dataUrl) => {
      return await new Promise<{
        width: number;
        height: number;
        opaqueSamples: number;
        uniqueSampleColors: number;
        darkSamples: number;
        bottomBandDarkSamples: number;
      }>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              width: img.width,
              height: img.height,
              opaqueSamples: 0,
              uniqueSampleColors: 0,
              darkSamples: 0,
              bottomBandDarkSamples: 0
            });
            return;
          }

          ctx.drawImage(img, 0, 0);
          const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const stepX = Math.max(1, Math.floor(width / 50));
          const stepY = Math.max(1, Math.floor(height / 50));

          let opaqueSamples = 0;
          let darkSamples = 0;
          let bottomBandDarkSamples = 0;
          const sampledColors = new Set<string>();

          for (let y = 0; y < height; y += stepY) {
            for (let x = 0; x < width; x += stepX) {
              const index = (y * width + x) * 4;
              const r = data[index];
              const g = data[index + 1];
              const b = data[index + 2];
              const a = data[index + 3];

              if (a > 0) {
                opaqueSamples += 1;
              }

              sampledColors.add(
                `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}-${Math.round(a / 64)}`
              );

              const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              if (a > 0 && luminance < 40) {
                darkSamples += 1;
                if (y > height * 0.75) {
                  bottomBandDarkSamples += 1;
                }
              }
            }
          }

          resolve({
            width,
            height,
            opaqueSamples,
            uniqueSampleColors: sampledColors.size,
            darkSamples,
            bottomBandDarkSamples
          });
        };

        img.onerror = () => {
          resolve({
            width: 0,
            height: 0,
            opaqueSamples: 0,
            uniqueSampleColors: 0,
            darkSamples: 0,
            bottomBandDarkSamples: 0
          });
        };

        img.src = dataUrl;
      });
    },
    `data:image/png;base64,${fileBuffer.toString('base64')}`
  );

  expect(imageAnalysis.width).toBeGreaterThan(100);
  expect(imageAnalysis.height).toBeGreaterThan(100);
  expect(imageAnalysis.opaqueSamples).toBeGreaterThan(100);
  expect(imageAnalysis.uniqueSampleColors).toBeGreaterThan(8);
  expect(imageAnalysis.darkSamples).toBeGreaterThan(0);
  expect(imageAnalysis.bottomBandDarkSamples).toBeGreaterThan(0);
});
