// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }
    await expect(printingPanel).toBeVisible();

    const titleValue = 'Current weather map';
    const labeledTitleInputCandidates = printingPanel.getByLabel(/title/i);
    const titleInput =
        (await labeledTitleInputCandidates.count()) > 0
            ? labeledTitleInputCandidates.first()
            : printingPanel.getByRole('textbox').first();

    await expect(titleInput).toBeVisible();
    await titleInput.fill(titleValue);
    await expect(titleInput).toHaveValue(titleValue);

    const pngRadioCandidates = printingPanel.getByRole('radio', { name: /png/i });
    if ((await pngRadioCandidates.count()) > 0) {
        const pngRadio = pngRadioCandidates.first();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const labeledFormatComboboxCandidates = printingPanel.getByRole('combobox', { name: /format/i });
        const genericComboboxCandidates = printingPanel.getByRole('combobox');

        if ((await labeledFormatComboboxCandidates.count()) > 0 || (await genericComboboxCandidates.count()) > 0) {
            const formatCombobox =
                (await labeledFormatComboboxCandidates.count()) > 0
                    ? labeledFormatComboboxCandidates.first()
                    : genericComboboxCandidates.first();

            await expect(formatCombobox).toBeVisible();

            const isNativeSelect = await formatCombobox.evaluate((el) => el instanceof HTMLSelectElement);

            if (isNativeSelect) {
                const pngValue = await formatCombobox.evaluate((el) => {
                    if (!(el instanceof HTMLSelectElement)) {
                        return undefined;
                    }
                    const option = [...el.options].find(
                        (entry) =>
                            /png/i.test(entry.label) ||
                            /png/i.test(entry.textContent ?? '') ||
                            /png/i.test(entry.value)
                    );
                    return option?.value;
                });

                expect(pngValue).toBeDefined();
                await formatCombobox.selectOption(pngValue!);
                await expect
                    .poll(() =>
                        formatCombobox.evaluate((el) => {
                            if (el instanceof HTMLSelectElement) {
                                const selected = el.selectedOptions[0];
                                return `${el.value} ${selected?.label ?? ''}`.trim();
                            }
                            return '';
                        })
                    )
                    .toMatch(/png/i);
            } else {
                await formatCombobox.click();
                const pngOption = page.getByRole('option', { name: /png/i }).first();
                await expect(pngOption).toBeVisible();
                await pngOption.click();
                await expect
                    .poll(() =>
                        formatCombobox.evaluate((el) => {
                            const value = (el as HTMLInputElement).value;
                            const text = el.textContent ?? '';
                            return `${value} ${text}`.trim();
                        })
                    )
                    .toMatch(/png/i);
            }
        } else {
            const pngButton = printingPanel.getByRole('button', { name: /png/i }).first();
            await expect(pngButton).toBeVisible();
            await pngButton.click();
        }
    }

    const exportButton = printingPanel.getByRole('button', { name: /export|print|download/i }).first();
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const tempDir = await mkdtemp(join(tmpdir(), 'playwright-print-'));
    const downloadedFilePath = join(tempDir, suggestedFilename);
    await download.saveAs(downloadedFilePath);

    const fileBytes = await readFile(downloadedFilePath);
    expect(fileBytes.length).toBeGreaterThan(1000);
    expect(fileBytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
});
