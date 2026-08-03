// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const printToggle = page.getByTestId('print-toggle');

    const titleInputCandidates = [
        page.getByRole('textbox', { name: /title/i }),
        page.getByLabel(/title/i),
        page.getByPlaceholder(/title/i)
    ];

    let printPanelVisible = false;
    for (const candidate of titleInputCandidates) {
        if (await candidate.isVisible()) {
            printPanelVisible = true;
            break;
        }
    }

    if (!printPanelVisible) {
        const isPressed = await printToggle.getAttribute('aria-pressed');
        if (isPressed !== 'true') {
            await printToggle.click();
        }
    }

    let titleInput = titleInputCandidates[0];
    for (const candidate of titleInputCandidates) {
        if (await candidate.isVisible()) {
            titleInput = candidate;
            break;
        }
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill('Playwright PNG export');

    const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
    const formatCombobox = page.getByRole('combobox', { name: /format/i });

    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        await expect(formatCombobox).toBeVisible();
        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            try {
                await formatCombobox.selectOption({ value: 'png' });
            } catch {
                await formatCombobox.click();
                await page.getByRole('option', { name: /^PNG$/i }).click();
            }
        }

        await expect.poll(async () => {
            try {
                return await formatCombobox.inputValue();
            } catch {
                return await formatCombobox.textContent();
            }
        }).toMatch(/png/i);
    }

    const exportButtonCandidates = [
        page.getByRole('button', { name: /^Export$/i }),
        page.getByRole('button', { name: /^Print$/i }),
        page.getByRole('button', { name: /export/i }),
        page.getByRole('button', { name: /download/i })
    ];

    let exportButton = exportButtonCandidates[0];
    for (const candidate of exportButtonCandidates) {
        if (await candidate.isVisible()) {
            exportButton = candidate;
            break;
        }
    }

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath as string);
    expect(fileContent.byteLength).toBeGreaterThan(1000);
    expect(fileContent.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
});
