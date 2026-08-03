// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(async () => (await getActiveBaseLayerTitle(page)) ?? '').toMatch(/\S/);
    await expect.poll(async () => {
        const visibleStates = await Promise.all([
            isLayerRendered(page, 'Temperature'),
            isLayerRendered(page, 'UV-Index Stations'),
            isLayerRendered(page, 'EUCOS Ground Stations')
        ]);
        return visibleStates.some(Boolean);
    }).toBe(true);

    const printPanel = page.getByTestId('printing-panel');
    if (!(await printPanel.isVisible())) {
        await page.getByTestId('print-toggle').click();
    }

    await expect(printPanel).toBeVisible();
    await expect(page.getByTestId('printing')).toBeVisible();

    let titleInput = printPanel.getByLabel(/title/i);
    if ((await titleInput.count()) === 0) {
        titleInput = printPanel.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();

    const printTitle = 'Current weather map';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printPanel.getByRole('radio', { name: /png/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let pngButton = printPanel.getByRole('button', { name: /^png$/i });
        if ((await pngButton.count()) > 0) {
            await pngButton.click();
            if ((await pngButton.getAttribute('aria-pressed')) !== null) {
                await expect(pngButton).toHaveAttribute('aria-pressed', 'true');
            }
        } else {
            let formatSelect = printPanel.getByRole('combobox', { name: /format/i });
            if ((await formatSelect.count()) === 0) {
                formatSelect = printPanel.getByRole('combobox').first();
            }
            await expect(formatSelect).toBeVisible();

            const pngValue = await formatSelect.evaluate((element) => {
                const select = element as HTMLSelectElement;
                const option = Array.from(select.options).find(
                    (entry) =>
                        /png/i.test(entry.label) ||
                        /png/i.test(entry.text) ||
                        /png/i.test(entry.value)
                );
                return option?.value;
            });

            expect(pngValue).toBeTruthy();
            await formatSelect.selectOption(pngValue!);

            await expect.poll(async () => {
                return formatSelect.evaluate((element) => {
                    const select = element as HTMLSelectElement;
                    return select.selectedOptions[0]?.textContent?.trim() ?? '';
                });
            }).toMatch(/png/i);
        }
    }

    let exportButton = printPanel.getByRole('button', { name: /export/i });
    if ((await exportButton.count()) === 0) {
        exportButton = printPanel.getByRole('button', { name: /^print$/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printPanel.getByRole('button', { name: /download/i });
    }
    if ((await exportButton.count()) === 0) {
        exportButton = printPanel.getByRole('button').last();
    }
    await expect(exportButton.first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.first().click();
    const download = await downloadPromise;

    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.length).toBeGreaterThan(8);
    expect(fileContent.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(async () => (await getActiveBaseLayerTitle(page)) ?? '').toMatch(/\S/);
    await expect.poll(async () => {
        const visibleStates = await Promise.all([
            isLayerRendered(page, 'Temperature'),
            isLayerRendered(page, 'UV-Index Stations'),
            isLayerRendered(page, 'EUCOS Ground Stations')
        ]);
        return visibleStates.some(Boolean);
    }).toBe(true);
});
