// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printingPanel = page.getByTestId('printing-panel');
    if (!(await printingPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingPanel.getByTestId('printing')).toBeVisible();

    let titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();

    const printTitle = 'Current weather map';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatCombobox = printingPanel.getByRole('combobox').first();
        await expect(formatCombobox).toBeVisible();

        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            try {
                await formatCombobox.selectOption('png');
            } catch {
                await formatCombobox.click();
                await page.getByRole('option', { name: /^png$/i }).click();
            }
        }

        await expect.poll(async () => {
            const value = await formatCombobox
                .inputValue()
                .catch(async () => (await formatCombobox.textContent()) ?? '');
            return value.trim();
        }).toMatch(/png/i);
    }

    const exportButton = printingPanel.getByRole('button', { name: /export|print/i }).first();
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const stream = await download.createReadStream();
    expect(stream).not.toBeNull();

    const fileBytes = await new Promise<Buffer>((resolve, reject) => {
        if (!stream) {
            reject(new Error('Download stream is not available.'));
            return;
        }

        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });

    expect(fileBytes.length).toBeGreaterThan(1000);
    expect(
        fileBytes
            .subarray(0, 8)
            .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe(true);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
