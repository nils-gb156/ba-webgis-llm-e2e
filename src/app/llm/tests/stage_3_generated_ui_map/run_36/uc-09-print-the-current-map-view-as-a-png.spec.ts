// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('UC9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    const printTitle = 'Current weather overview';
    let titleInput = printingPanel.getByLabel(/title/i);
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const labeledFormatCombobox = printingPanel.getByRole('combobox', { name: /format/i });
    if ((await labeledFormatCombobox.count()) > 0) {
        await expect(labeledFormatCombobox).toBeVisible();
        try {
            await labeledFormatCombobox.selectOption({ label: 'PNG' });
        } catch {
            try {
                await labeledFormatCombobox.selectOption({ value: 'png' });
            } catch {
                await labeledFormatCombobox.selectOption({ value: 'image/png' });
            }
        }
        await expect(labeledFormatCombobox).toHaveValue(/png/i);
    } else if ((await printingPanel.getByRole('combobox').count()) > 0) {
        const formatCombobox = printingPanel.getByRole('combobox').first();
        await expect(formatCombobox).toBeVisible();
        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            try {
                await formatCombobox.selectOption({ value: 'png' });
            } catch {
                await formatCombobox.selectOption({ value: 'image/png' });
            }
        }
        await expect(formatCombobox).toHaveValue(/png/i);
    } else {
        const pngRadio = printingPanel.getByRole('radio', { name: /png/i });
        await expect(pngRadio).toBeVisible();
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    }

    const downloadPromise = page.waitForEvent('download');

    const exportButton = printingPanel.getByRole('button', { name: /^(export|print)$/i });
    if ((await exportButton.count()) > 0) {
        await exportButton.click();
    } else {
        await printingPanel.getByRole('button', { name: /export|print/i }).last().click();
    }

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/i);
    expect(await download.path()).not.toBeNull();
});
