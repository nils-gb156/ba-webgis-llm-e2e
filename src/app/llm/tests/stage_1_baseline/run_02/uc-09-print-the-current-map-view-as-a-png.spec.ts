// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const printMapButton = page.getByRole('button', { name: 'Print Map', exact: true });
  await expect(printMapButton).toBeVisible();

  const scaleBar = page.locator('.ol-scale-line');
  await expect(scaleBar).toBeVisible();

  const printPanelHeading = page.getByRole('heading', { name: 'Print Map', exact: true });
  if (!(await printPanelHeading.isVisible().catch(() => false))) {
    const isPressed = (await printMapButton.getAttribute('aria-pressed')) === 'true';
    if (!isPressed) {
      await printMapButton.click();
    }
  }
  await expect(printPanelHeading).toBeVisible();

  const titleInput = page.getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('E2E PNG map export');

  const pngRadio = page.getByRole('radio', { name: /png/i });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatSelect = page.getByRole('combobox', { name: /format/i });
    await expect(formatSelect).toBeVisible();
    await formatSelect.selectOption({ label: 'PNG' });
    await expect(formatSelect).toHaveValue(/png/i);
  }

  let exportButton = page.getByRole('button', { name: 'Export', exact: true });
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: 'Print', exact: true });
  }
  if ((await exportButton.count()) === 0) {
    exportButton = page.getByRole('button', { name: 'Export Map', exact: true });
  }
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileBuffer = await readFile(downloadPath!);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);
  expect(fileBuffer.length).toBeGreaterThan(10_000);

  const imageAnalysis = await page.evaluate(async (base64Content) => {
    const dataUrl = `data:image/png;base64,${base64Content}`;
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load downloaded PNG for validation.'));
      img.src = dataUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('2D canvas context is not available.');
    }

    context.drawImage(image, 0, 0);

    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    const sampleStep = Math.max(1, Math.floor((width * height) / 5000));

    let opaqueSamples = 0;
    let nonWhiteSamples = 0;
    let nonGraySamples = 0;
    const uniqueColors = new Set<string>();

    for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += sampleStep) {
      const offset = pixelIndex * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const a = data[offset + 3];

      if (a > 0) {
        opaqueSamples += 1;
      }
      if (!(r > 245 && g > 245 && b > 245)) {
        nonWhiteSamples += 1;
      }
      if (!(r === g && g === b)) {
        nonGraySamples += 1;
      }

      uniqueColors.add(`${r},${g},${b},${a}`);
    }

    return {
      width,
      height,
      opaqueSamples,
      nonWhiteSamples,
      nonGraySamples,
      uniqueColorCount: uniqueColors.size
    };
  }, fileBuffer.toString('base64'));

  expect(imageAnalysis.width).toBeGreaterThan(200);
  expect(imageAnalysis.height).toBeGreaterThan(200);
  expect(imageAnalysis.opaqueSamples).toBeGreaterThan(100);
  expect(imageAnalysis.nonWhiteSamples).toBeGreaterThan(100);
  expect(imageAnalysis.uniqueColorCount).toBeGreaterThan(20);
  expect(imageAnalysis.nonGraySamples).toBeGreaterThan(20);
});
