// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
  const findFirstVisible = async (candidates: any[]): Promise<any | null> => {
    for (const candidate of candidates) {
      if ((await candidate.count()) > 0 && (await candidate.first().isVisible())) {
        return candidate.first();
      }
    }
    return null;
  };

  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-toolbar')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();
  await expect(page.getByTestId('scale-bar')).toBeVisible();

  await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();

  const titleCandidates = [
    page.getByRole('textbox', { name: /title/i }),
    page.getByLabel(/title/i),
  ];

  let titleInput = await findFirstVisible(titleCandidates);

  if (!titleInput) {
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await page.getByTestId('print-toggle').click();

    await expect
      .poll(async () => {
        const visibleTitleInput = await findFirstVisible(titleCandidates);
        return visibleTitleInput !== null;
      })
      .toBe(true);

    titleInput = await findFirstVisible(titleCandidates);
  }

  await expect(titleInput).toBeVisible();
  await titleInput.fill('Weather map export');

  const pngRadio = page.getByRole('radio', { name: /^png$/i });
  const pngButtonCandidates = [
    page.getByRole('button', { name: /^png$/i }),
    page.getByRole('tab', { name: /^png$/i }),
  ];
  const formatCandidates = [
    page.getByRole('combobox', { name: /format|file format|output format|image format/i }),
    page.getByLabel(/format|file format|output format|image format/i),
  ];

  if ((await pngRadio.count()) > 0 && (await pngRadio.first().isVisible())) {
    await pngRadio.first().click({ force: true });
    await expect(pngRadio.first()).toBeChecked();
  } else {
    const pngButton = await findFirstVisible(pngButtonCandidates);

    if (pngButton) {
      await pngButton.click();
    } else {
      const formatControl = await findFirstVisible(formatCandidates);
      await expect(formatControl).toBeVisible();

      const tagName = await formatControl.evaluate((element: Element) => element.tagName.toLowerCase());

      if (tagName === 'select') {
        await formatControl.evaluate((element: Element) => {
          const select = element as HTMLSelectElement;
          const option = Array.from(select.options).find(
            (candidate) =>
              /png/i.test(candidate.label) ||
              /png/i.test(candidate.text) ||
              /png/i.test(candidate.value)
          );

          if (!option) {
            throw new Error('PNG format option not found.');
          }

          select.value = option.value;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        await expect.poll(async () => await formatControl.inputValue()).toMatch(/png/i);
      } else {
        await formatControl.click();
        const pngOptionCandidates = [
          page.getByRole('option', { name: /png/i }),
          page.getByRole('menuitemradio', { name: /png/i }),
          page.getByText(/^PNG$/i),
        ];

        await expect
          .poll(async () => {
            const visiblePngOption = await findFirstVisible(pngOptionCandidates);
            return visiblePngOption !== null;
          })
          .toBe(true);

        const pngOption = await findFirstVisible(pngOptionCandidates);
        await expect(pngOption).toBeVisible();
        await pngOption.click();
      }
    }
  }

  const exportButtonCandidates = [
    page.getByRole('button', { name: /^create print$/i }),
    page.getByRole('button', { name: /^create printout$/i }),
    page.getByRole('button', { name: /^export$/i }),
    page.getByRole('button', { name: /^print$/i }),
    page.getByRole('button', { name: /^download$/i }),
  ];

  await expect
    .poll(async () => {
      const visibleExportButton = await findFirstVisible(exportButtonCandidates);
      return visibleExportButton !== null;
    })
    .toBe(true);

  const exportButton = await findFirstVisible(exportButtonCandidates);
  await expect(exportButton).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();

  const download = await downloadPromise;
  const downloadFailure = await download.failure();
  expect(downloadFailure).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const fileBuffer = await fs.readFile(downloadPath!);
  expect(fileBuffer.length).toBeGreaterThan(0);
  expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  await expect(page.getByTestId('scale-bar')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
});
