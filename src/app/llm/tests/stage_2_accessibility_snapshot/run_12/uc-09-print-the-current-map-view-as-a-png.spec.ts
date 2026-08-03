// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();

  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true });
  await expect(eucosCheckbox).toBeChecked();
  await expect(page.getByTestId('eucos-stations-legend')).toBeVisible();

  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(temperatureCheckbox).toBeChecked();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();
  await printToggle.click();

  const printDialog = page.getByRole('dialog');
  const titleByLabel = page.getByLabel(/title/i);

  await expect
    .poll(async () => {
      const dialogIsVisible =
        (await printDialog.count()) > 0 && (await printDialog.first().isVisible());
      const titleIsVisible =
        (await titleByLabel.count()) > 0 && (await titleByLabel.first().isVisible());
      return dialogIsVisible || titleIsVisible;
    })
    .toBe(true);

  const dialogVisible =
    (await printDialog.count()) > 0 && (await printDialog.first().isVisible());
  const printScope = dialogVisible ? printDialog.first() : page;

  if (dialogVisible) {
    await expect(printDialog.first()).toBeVisible();
  }

  const titleCandidates = [
    printScope.getByLabel(/title/i),
    printScope.getByRole('textbox', { name: /title/i }),
    printScope.getByPlaceholder(/title/i),
  ];

  if (dialogVisible) {
    titleCandidates.push(printScope.getByRole('textbox').first());
  }

  let titleInput = titleCandidates[0];
  let titleInputFound = false;

  for (const candidate of titleCandidates) {
    if ((await candidate.count()) > 0) {
      titleInput = candidate.first();
      titleInputFound = true;
      break;
    }
  }

  expect(titleInputFound).toBeTruthy();
  await expect(titleInput).toBeVisible();

  const printTitle = 'E2E PNG map export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  let pngSelected = false;
  let formatCombobox = printScope.getByRole('combobox', { name: /format|file format|type/i }).first();

  const pngRadio = printScope.getByRole('radio', { name: /^png$/i });
  if ((await pngRadio.count()) > 0) {
    await pngRadio.first().click({ force: true });
    await expect(pngRadio.first()).toBeChecked();
    pngSelected = true;
  }

  if (!pngSelected) {
    if ((await formatCombobox.count()) === 0 && dialogVisible) {
      const anyDialogCombobox = printScope.getByRole('combobox');
      if ((await anyDialogCombobox.count()) > 0) {
        formatCombobox = anyDialogCombobox.first();
      }
    }

    if ((await formatCombobox.count()) > 0) {
      await expect(formatCombobox).toBeVisible();

      for (const option of [{ label: 'PNG' }, { label: 'png' }]) {
        if (pngSelected) {
          break;
        }
        try {
          await formatCombobox.selectOption(option);
          pngSelected = true;
        } catch {
          // try next strategy
        }
      }

      for (const option of ['PNG', 'png']) {
        if (pngSelected) {
          break;
        }
        try {
          await formatCombobox.selectOption(option);
          pngSelected = true;
        } catch {
          // try next strategy
        }
      }

      if (!pngSelected) {
        try {
          await formatCombobox.click();
          const pngOption = page.getByRole('option', { name: /^png$/i }).first();
          if ((await pngOption.count()) > 0) {
            await pngOption.click();
            pngSelected = true;
          }
        } catch {
          // final assertion below will fail if PNG could not be selected
        }
      }

      if (pngSelected) {
        await expect
          .poll(async () => {
            const text = ((await formatCombobox.textContent()) ?? '').toLowerCase();
            let value = '';
            try {
              value = (await formatCombobox.inputValue()).toLowerCase();
            } catch {
              // ignore for non-input combobox implementations
            }
            return `${text} ${value}`;
          })
          .toMatch(/png/);
      }
    }
  }

  expect(pngSelected).toBeTruthy();

  const exportCandidates = [
    printScope.getByRole('button', { name: /^export$/i }),
    printScope.getByRole('button', { name: /^download$/i }),
    printScope.getByRole('button', { name: /^print$/i }),
    printScope.getByRole('button', { name: /^print map$/i }),
    printScope.getByRole('button', { name: /export/i }),
    printScope.getByRole('button', { name: /download/i }),
  ];

  let exportButton = exportCandidates[0];
  let exportButtonFound = false;

  for (const candidate of exportCandidates) {
    if ((await candidate.count()) > 0) {
      exportButton = candidate.first();
      exportButtonFound = true;
      break;
    }
  }

  expect(exportButtonFound).toBeTruthy();
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();

  expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileContent = await readFile(downloadPath!);
  expect(fileContent.length).toBeGreaterThan(8);
  expect(fileContent.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
});
