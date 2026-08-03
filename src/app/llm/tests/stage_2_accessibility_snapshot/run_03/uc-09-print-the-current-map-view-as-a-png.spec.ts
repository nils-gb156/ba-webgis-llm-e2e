// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('print-toggle')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(page.getByTestId('scale-viewer')).toContainText('Current scale:');

  await page.getByTestId('print-toggle').click();

  const titleInput = page.getByRole('textbox', { name: /title/i });
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Current weather map');
  await expect(titleInput).toHaveValue('Current weather map');

  const pngRadio = page.getByRole('radio', { name: /^png$/i });
  if (await pngRadio.count()) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else {
    const formatCombobox = page.getByRole('combobox', { name: /format/i });
    await expect(formatCombobox).toBeVisible();
    try {
      await formatCombobox.selectOption('png');
    } catch {
      await formatCombobox.selectOption({ label: 'PNG' });
    }
    await expect(formatCombobox).toHaveValue(/png/i);
  }

  const exportButtonCandidates = [
    page.getByRole('button', { name: /^export$/i }),
    page.getByRole('button', { name: /^print$/i }),
    page.getByRole('button', { name: /^download$/i })
  ];

  let exportButton = exportButtonCandidates[0];
  for (const candidate of exportButtonCandidates) {
    if ((await candidate.count()) > 0) {
      const visibleCandidate = candidate.first();
      if (await visibleCandidate.isVisible()) {
        exportButton = visibleCandidate;
        break;
      }
    }
  }

  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileBuffer = await fs.readFile(downloadPath!);
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  expect(fileBuffer.subarray(0, 8).equals(pngSignature)).toBe(true);
  expect(fileBuffer.length).toBeGreaterThan(1000);

  const width = fileBuffer.readUInt32BE(16);
  const height = fileBuffer.readUInt32BE(20);

  expect(width).toBeGreaterThan(0);
  expect(height).toBeGreaterThan(0);
});
