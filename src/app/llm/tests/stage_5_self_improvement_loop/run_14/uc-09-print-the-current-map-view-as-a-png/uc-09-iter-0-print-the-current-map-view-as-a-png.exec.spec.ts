// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import * as fs from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printTogglePressed = await printToggle.getAttribute('aria-pressed');
    if (printTogglePressed !== 'true') {
        await printToggle.click();
    }

    const printDialog = page.getByRole('dialog', { name: /print/i });
    if (await printDialog.count() > 0) {
        await expect(printDialog.first()).toBeVisible();
    }

    const titleInput = page.getByRole('textbox', { name: /title/i });
    await expect(titleInput).toBeVisible();
    await titleInput.fill('E2E map export');

    const pngRadio = page.getByRole('radio', { name: /png/i }).first();
    const labeledFormatCombobox = page.getByRole('combobox', { name: /format/i }).first();

    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if (await labeledFormatCombobox.isVisible()) {
        try {
            await labeledFormatCombobox.selectOption({ label: 'PNG' });
        } catch {
            await labeledFormatCombobox.selectOption({ value: 'png' });
        }
        await expect(labeledFormatCombobox).toHaveValue(/png/i);
    } else {
        const allComboboxes = page.getByRole('combobox');
        const comboboxCount = await allComboboxes.count();
        expect(comboboxCount).toBeGreaterThan(1);

        const formatCombobox = allComboboxes.last();
        await expect(formatCombobox).toBeVisible();
        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            await formatCombobox.selectOption({ value: 'png' });
        }
        await expect(formatCombobox).toHaveValue(/png/i);
    }

    let exportButton = page.getByRole('button', { name: /^(Export|Print|Download)$/i }).first();
    if (await printDialog.count() > 0 && await printDialog.first().isVisible()) {
        exportButton = printDialog.first().getByRole('button', { name: /(export|print|download)/i }).first();
    }

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const savedFile = test.info().outputPath(download.suggestedFilename());
    await download.saveAs(savedFile);

    const fileBuffer = await fs.readFile(savedFile);
    expect(fileBuffer.byteLength).toBeGreaterThan(5000);
    expect(fileBuffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
});
