// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'fs/promises';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();

  const printToggle = page.getByTestId('print-toggle');
  await expect(printToggle).toBeVisible();

  const titleTextboxByName = page.getByRole('textbox', { name: /title/i });
  const titleTextboxVisibleBeforeOpen =
    (await titleTextboxByName.count()) > 0 && (await titleTextboxByName.first().isVisible());
  const printTogglePressed = await printToggle.getAttribute('aria-pressed');

  if (printTogglePressed !== 'true' && !titleTextboxVisibleBeforeOpen) {
    await printToggle.click();
  }

  if ((await printToggle.getAttribute('aria-pressed')) !== null) {
    await expect(printToggle).toHaveAttribute('aria-pressed', 'true');
  }

  await expect.poll(async () => {
    const namedTitle = page.getByRole('textbox', { name: /title/i });
    if ((await namedTitle.count()) > 0 && (await namedTitle.first().isVisible())) {
      return true;
    }

    const allTextboxes = page.getByRole('textbox');
    return (await allTextboxes.count()) > 1;
  }).toBe(true);

  let titleInput = page.getByRole('textbox', { name: /title/i });
  if ((await titleInput.count()) === 0 || !(await titleInput.first().isVisible())) {
    titleInput = page.getByRole('textbox').nth(1);
  }

  await expect(titleInput).toBeVisible();

  const printTitle = 'Weather map PNG export';
  await titleInput.fill(printTitle);
  await expect(titleInput).toHaveValue(printTitle);

  await expect.poll(async () => {
    const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
    if ((await pngRadio.count()) > 0 && (await pngRadio.first().isVisible())) {
      return true;
    }

    const pngButton = page.getByRole('button', { name: /^PNG$/i });
    if ((await pngButton.count()) > 0 && (await pngButton.first().isVisible())) {
      return true;
    }

    const comboboxes = page.getByRole('combobox');
    const comboboxCount = await comboboxes.count();

    for (let i = 0; i < comboboxCount; i++) {
      const combobox = comboboxes.nth(i);
      if (!(await combobox.isVisible())) {
        continue;
      }

      try {
        const options = await combobox.evaluate((node) => {
          const select = node as HTMLSelectElement;
          return Array.from(select.options ?? []).map((option) => ({
            label: option.label,
            value: option.value
          }));
        });

        if (options.some((option) => /png/i.test(option.label) || /png/i.test(option.value))) {
          return true;
        }
      } catch {
      }
    }

    return false;
  }).toBe(true);

  let formatSelected = false;

  const formatComboboxes = page.getByRole('combobox');
  const formatComboboxCount = await formatComboboxes.count();

  for (let i = 0; i < formatComboboxCount; i++) {
    const combobox = formatComboboxes.nth(i);
    if (!(await combobox.isVisible())) {
      continue;
    }

    try {
      const options = await combobox.evaluate((node) => {
        const select = node as HTMLSelectElement;
        return Array.from(select.options ?? []).map((option) => ({
          label: option.label,
          value: option.value
        }));
      });

      const pngOption = options.find((option) => /png/i.test(option.label) || /png/i.test(option.value));
      if (!pngOption) {
        continue;
      }

      if (pngOption.value) {
        await combobox.selectOption({ value: pngOption.value });
      } else {
        await combobox.selectOption({ label: pngOption.label });
      }

      await expect.poll(async () => {
        return await combobox.evaluate((node) => {
          const select = node as HTMLSelectElement;
          return select.selectedOptions[0]?.label ?? select.value;
        });
      }).toMatch(/png/i);

      formatSelected = true;
      break;
    } catch {
    }
  }

  if (!formatSelected) {
    const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
    if ((await pngRadio.count()) > 0) {
      await pngRadio.click({ force: true });
      await expect(pngRadio).toBeChecked();
      formatSelected = true;
    }
  }

  if (!formatSelected) {
    const pngButton = page.getByRole('button', { name: /^PNG$/i });
    if ((await pngButton.count()) > 0) {
      await pngButton.click();
      if ((await pngButton.getAttribute('aria-pressed')) !== null) {
        await expect(pngButton).toHaveAttribute('aria-pressed', 'true');
      }
      formatSelected = true;
    }
  }

  expect(formatSelected).toBe(true);

  const exportButtonCandidates = [
    page.getByRole('button', { name: /^Export$/i }),
    page.getByRole('button', { name: /^Export map$/i }),
    page.getByRole('button', { name: /^Print$/i }),
    page.getByRole('button', { name: /^Download$/i }),
    page.getByRole('button', { name: /^Generate$/i })
  ];

  await expect.poll(async () => {
    for (const candidate of exportButtonCandidates) {
      if ((await candidate.count()) > 0 && (await candidate.first().isVisible())) {
        return true;
      }
    }
    return false;
  }).toBe(true);

  let exportButton = exportButtonCandidates[0];
  for (const candidate of exportButtonCandidates) {
    if ((await candidate.count()) > 0 && (await candidate.first().isVisible())) {
      exportButton = candidate;
      break;
    }
  }

  await expect(exportButton).toBeVisible();
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  await expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  if (downloadPath) {
    const fileContent = await readFile(downloadPath);
    expect(fileContent.length).toBeGreaterThan(8);
    expect(fileContent.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
  }
});
