// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const titleInputByLabel = page.getByLabel(/title/i);
    const titleInputByRole = page.getByRole('textbox', { name: /title/i });

    let printPanelVisible = await titleInputByLabel.isVisible();
    if (!printPanelVisible) {
        printPanelVisible = await titleInputByRole.isVisible();
    }

    if (!printPanelVisible) {
        await printToggle.click();
    }

    let titleInput = titleInputByLabel;
    if (!(await titleInput.isVisible())) {
        titleInput = titleInputByRole;
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill('E2E PNG Export');

    const pngRadio = page.getByRole('radio', { name: /^png$/i });
    const pngButton = page.getByRole('button', { name: /^png$/i });
    const formatCombobox = page.getByRole('combobox', { name: /format/i });

    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await pngButton.isVisible()) {
        await pngButton.click();
    } else {
        await expect(formatCombobox).toBeVisible();

        let selectedPng = false;

        try {
            const pngLabel = await formatCombobox.evaluate((element) => {
                if (!(element instanceof HTMLSelectElement)) {
                    return undefined;
                }
                return Array.from(element.options).find((option) => /png/i.test(option.label))?.label;
            });

            if (pngLabel) {
                await formatCombobox.selectOption({ label: pngLabel });
                await expect.poll(() =>
                    formatCombobox.evaluate((element) => {
                        if (!(element instanceof HTMLSelectElement)) {
                            return '';
                        }
                        return element.selectedOptions[0]?.label ?? '';
                    }),
                ).toMatch(/png/i);
                selectedPng = true;
            }
        } catch {
            // Fall back to a custom combobox interaction below.
        }

        if (!selectedPng) {
            await formatCombobox.click();
            const pngOption = page.getByRole('option', { name: /png/i });
            await expect(pngOption).toBeVisible();
            await pngOption.click();
        }
    }

    let exportButton = page.getByRole('button', { name: /^export$/i });
    if (!(await exportButton.isVisible())) {
        exportButton = page.getByRole('button', { name: /^download$/i });
    }
    if (!(await exportButton.isVisible())) {
        exportButton = page.getByRole('button', { name: /^print$/i });
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (downloadPath) {
        const fileData = await readFile(downloadPath);
        expect(fileData.byteLength).toBeGreaterThan(1000);
        expect(fileData.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
        expect(fileData.readUInt32BE(16)).toBeGreaterThan(0);
        expect(fileData.readUInt32BE(20)).toBeGreaterThan(0);
    }

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
