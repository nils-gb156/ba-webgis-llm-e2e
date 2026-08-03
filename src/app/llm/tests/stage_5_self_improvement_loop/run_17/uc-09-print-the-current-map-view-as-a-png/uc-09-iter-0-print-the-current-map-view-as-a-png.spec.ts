// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../../map-model-helpers";

test('UC9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('print-toggle')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect
        .poll(async () => {
            return (
                (await isLayerRendered(page, 'EUCOS Ground Stations')) ||
                (await isLayerRendered(page, 'UV-Index Stations')) ||
                (await isLayerRendered(page, 'Temperature'))
            );
        })
        .toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printTogglePressed = await printToggle.getAttribute('aria-pressed');
    if (printTogglePressed !== 'true') {
        await printToggle.click();
    }

    await expect
        .poll(async () => {
            if (await page.getByLabel(/title|name|file/i).first().isVisible()) return true;
            if (await page.getByPlaceholder(/title|name|file/i).first().isVisible()) return true;
            if (await page.getByRole('radio', { name: 'PNG', exact: true }).isVisible()) return true;
            if (await page.getByRole('combobox', { name: /format/i }).first().isVisible()) return true;
            return (await page.getByRole('textbox').count()) > 1;
        })
        .toBe(true);

    let titleInput = page.getByLabel(/title|name|file/i).first();
    if (!(await titleInput.isVisible())) {
        const placeholderTitleInput = page.getByPlaceholder(/title|name|file/i).first();
        if (await placeholderTitleInput.isVisible()) {
            titleInput = placeholderTitleInput;
        } else {
            const dialogs = page.getByRole('dialog');
            let foundDialogTextbox = false;
            const dialogCount = await dialogs.count();
            for (let i = 0; i < dialogCount; i++) {
                const dialogTextbox = dialogs.nth(i).getByRole('textbox').first();
                if (await dialogTextbox.isVisible()) {
                    titleInput = dialogTextbox;
                    foundDialogTextbox = true;
                    break;
                }
            }
            if (!foundDialogTextbox) {
                titleInput = page.getByRole('textbox').last();
            }
        }
    }

    await expect(titleInput).toBeVisible();

    const printTitle = 'uc9-current-map-view';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: 'PNG', exact: true });
    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let formatField = page.getByRole('combobox', { name: /format/i }).first();
        if (!(await formatField.isVisible())) {
            formatField = page.getByLabel(/format/i).first();
        }

        await expect(formatField).toBeVisible();

        let selected = false;
        try {
            await formatField.selectOption({ label: 'PNG' });
            selected = true;
        } catch {
            // ignore and try fallback interactions below
        }

        if (!selected) {
            try {
                await formatField.selectOption('PNG');
                selected = true;
            } catch {
                // ignore and try fallback interactions below
            }
        }

        if (!selected) {
            await formatField.click();
            const pngOption = page.getByRole('option', { name: 'PNG', exact: true });
            if (await pngOption.isVisible()) {
                await pngOption.click();
            } else {
                await page.getByText(/^PNG$/).click();
            }
        }

        await expect
            .poll(async () => {
                try {
                    return await formatField.inputValue();
                } catch {
                    return (await formatField.textContent()) ?? '';
                }
            })
            .toMatch(/png/i);
    }

    let exportButton = page.getByRole('button', { name: 'Export', exact: true });
    if (!(await exportButton.count())) {
        exportButton = page.getByRole('button', { name: 'Print', exact: true });
    }
    if (!(await exportButton.count())) {
        exportButton = page.getByRole('button', { name: 'Download', exact: true });
    }
    if (!(await exportButton.count())) {
        const dialogs = page.getByRole('dialog');
        const dialogCount = await dialogs.count();
        for (let i = 0; i < dialogCount; i++) {
            const candidate = dialogs.nth(i).getByRole('button', { name: /export|print|download/i }).first();
            if (await candidate.isVisible()) {
                exportButton = candidate;
                break;
            }
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename.toLowerCase()).toMatch(/\.png$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileStats = await stat(downloadPath!);
    expect(fileStats.size).toBeGreaterThan(5000);

    const fileBuffer = await readFile(downloadPath!);
    expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect
        .poll(async () => {
            return (
                (await isLayerRendered(page, 'EUCOS Ground Stations')) ||
                (await isLayerRendered(page, 'UV-Index Stations')) ||
                (await isLayerRendered(page, 'Temperature'))
            );
        })
        .toBe(true);
});
