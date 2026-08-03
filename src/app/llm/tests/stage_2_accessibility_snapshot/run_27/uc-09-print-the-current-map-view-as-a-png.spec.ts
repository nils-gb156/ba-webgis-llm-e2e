// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  const printTitle = 'UC9 PNG Export';

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();
  await expect(page.getByTestId('print-toggle')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps', exact: true });
  await expect(basemapCombobox).toBeVisible();
  await expect(basemapCombobox).toHaveValue(/.+/);

  const temperatureLayerCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(temperatureLayerCheckbox).toBeChecked();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();

  await page.getByTestId('print-toggle').click();

  const printDialog = page.getByRole('dialog').first();
  await expect(printDialog).toBeVisible();

  let titleInput = printDialog.getByRole('textbox', { name: /title/i });
  if ((await titleInput.count()) === 0) {
    titleInput = printDialog.getByPlaceholder(/title/i);
  }
  if ((await titleInput.count()) === 0) {
    titleInput = printDialog.getByRole('textbox').first();
  }
  await expect(titleInput).toBeVisible();
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  let pngSelected = false;

  const namedFormatCombobox = printDialog.getByRole('combobox', { name: /format/i }).first();
  if ((await namedFormatCombobox.count()) > 0) {
    await expect(namedFormatCombobox).toBeVisible();
    try {
      const pngOption = await namedFormatCombobox.evaluate((node) => {
        const select = node as HTMLSelectElement;
        const option = Array.from(select.options).find(
          (entry) => /png/i.test(entry.text) || /png/i.test(entry.value)
        );
        return option ? { text: option.text, value: option.value } : null;
      });
      expect(pngOption).not.toBeNull();
      await namedFormatCombobox.selectOption({ value: pngOption!.value });
      await expect
        .poll(async () => {
          return await namedFormatCombobox.evaluate((node) => {
            const select = node as HTMLSelectElement;
            const selected = select.selectedOptions[0];
            return `${selected?.text ?? ''} ${selected?.value ?? ''}`;
          });
        })
        .toMatch(/png/i);
      pngSelected = true;
    } catch {
      await namedFormatCombobox.click();
      const pngOption = page.getByRole('option', { name: /png/i }).first();
      await expect(pngOption).toBeVisible();
      await pngOption.click();
      await expect(namedFormatCombobox).toContainText(/png/i);
      pngSelected = true;
    }
  }

  if (!pngSelected) {
    const anyFormatCombobox = printDialog.getByRole('combobox').first();
    if ((await anyFormatCombobox.count()) > 0) {
      await expect(anyFormatCombobox).toBeVisible();
      try {
        const pngOption = await anyFormatCombobox.evaluate((node) => {
          const select = node as HTMLSelectElement;
          const option = Array.from(select.options).find(
            (entry) => /png/i.test(entry.text) || /png/i.test(entry.value)
          );
          return option ? { text: option.text, value: option.value } : null;
        });
        expect(pngOption).not.toBeNull();
        await anyFormatCombobox.selectOption({ value: pngOption!.value });
        await expect
          .poll(async () => {
            return await anyFormatCombobox.evaluate((node) => {
              const select = node as HTMLSelectElement;
              const selected = select.selectedOptions[0];
              return `${selected?.text ?? ''} ${selected?.value ?? ''}`;
            });
          })
          .toMatch(/png/i);
        pngSelected = true;
      } catch {
        await anyFormatCombobox.click();
        const pngOption = page.getByRole('option', { name: /png/i }).first();
        await expect(pngOption).toBeVisible();
        await pngOption.click();
        await expect(anyFormatCombobox).toContainText(/png/i);
        pngSelected = true;
      }
    }
  }

  if (!pngSelected) {
    const pngRadio = printDialog.getByRole('radio', { name: /png/i }).first();
    await expect(pngRadio).toBeVisible();
    await pngRadio.click({ force: true });
    await expect(pngRadio).toBeChecked();
    pngSelected = true;
  }

  expect(pngSelected).toBe(true);

  let exportButton = printDialog.getByRole('button', { name: /^(export|print|download|create)$/i });
  if ((await exportButton.count()) === 0) {
    exportButton = printDialog.getByRole('button', { name: /export|print|download|create/i }).last();
  }
  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(temperatureLayerCheckbox).toBeChecked();
  await expect(page.getByTestId('temperature-legend')).toBeVisible();
});
