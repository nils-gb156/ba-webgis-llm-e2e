// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const isVisible = async (locator: any) => {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  };

  const findFirstVisible = async (candidates: any[]) => {
    for (const candidate of candidates) {
      const locator = candidate.first();
      if (await isVisible(locator)) {
        return locator;
      }
    }
    return undefined;
  };

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
  await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();

  const printTogglePressed = await printToggle.getAttribute('aria-pressed');
  if (printTogglePressed !== 'true') {
    await printToggle.click();
  }

  await expect(printToggle).toHaveAttribute('aria-pressed', 'true');

  await expect
    .poll(async () => {
      const printPanelIndicators = [
        page.getByRole('dialog', { name: /print/i }),
        page.getByRole('heading', { name: /print/i }),
        page.getByRole('textbox', { name: /title/i }),
        page.getByLabel(/title/i),
        page.getByRole('radio', { name: /^PNG$/i }),
        page.getByRole('combobox', { name: /format/i })
      ];

      return Boolean(await findFirstVisible(printPanelIndicators));
    })
    .toBe(true);

  const titleInput =
    (await findFirstVisible([
      page.getByRole('textbox', { name: /title/i }),
      page.getByLabel(/title/i),
      page.getByPlaceholder(/title/i)
    ])) ?? undefined;

  if (!titleInput) {
    throw new Error('Could not find a visible title input in the print panel.');
  }

  const printTitle = 'E2E PNG Map Export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  const pngRadio = page.getByRole('radio', { name: /^PNG$/i }).first();
  const formatCombobox = page.getByRole('combobox', { name: /format/i }).first();

  if (await isVisible(pngRadio)) {
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
  } else if (await isVisible(formatCombobox)) {
    let formatSelected = false;

    try {
      await formatCombobox.selectOption({ label: 'PNG' });
      formatSelected = true;
    } catch {
      // ignore and try other selection strategies
    }

    if (!formatSelected) {
      try {
        await formatCombobox.selectOption({ value: 'png' });
        formatSelected = true;
      } catch {
        // ignore and try custom combobox interaction
      }
    }

    if (!formatSelected) {
      await formatCombobox.click();
      const pngOption = page.getByRole('option', { name: /^PNG$/i }).first();
      await expect(pngOption).toBeVisible();
      await pngOption.click();
      formatSelected = true;
    }

    await expect
      .poll(async () => {
        return await formatCombobox.evaluate((el: any) => {
          if (el instanceof HTMLSelectElement) {
            const selectedText = el.selectedOptions[0]?.text ?? '';
            return `${el.value} ${selectedText}`.trim();
          }
          return (el.textContent ?? '').trim();
        });
      })
      .toMatch(/png/i);
  } else {
    throw new Error('Could not find a visible PNG format control in the print panel.');
  }

  const exportButton =
    (await findFirstVisible([
      page.getByRole('button', { name: /^Export$/i }),
      page.getByRole('button', { name: /^Download$/i }),
      page.getByRole('button', { name: /export/i }),
      page.getByRole('button', { name: /download/i }),
      page.getByRole('button', { name: /generate/i }),
      page.getByRole('button', { name: /^Print$/i })
    ])) ?? undefined;

  if (!exportButton) {
    throw new Error('Could not find a visible export/print button in the print panel.');
  }

  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileContent = await readFile(downloadPath as string);
  expect(fileContent.length).toBeGreaterThan(1000);
  expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
