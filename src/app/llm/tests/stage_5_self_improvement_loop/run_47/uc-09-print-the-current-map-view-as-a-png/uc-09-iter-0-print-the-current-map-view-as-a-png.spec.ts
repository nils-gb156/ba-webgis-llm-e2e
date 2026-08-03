// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { getActiveBaseLayerTitle, isLayerRendered } from "../../../../map-model-helpers";

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const pickFirstVisible = async (locators: Locator[], description: string): Promise<Locator> => {
        for (const locator of locators) {
            const first = locator.first();
            if (await first.isVisible().catch(() => false)) {
                return first;
            }
        }
        throw new Error(`Could not find visible ${description}.`);
    };

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

    await page.getByTestId('print-toggle').click();

    const titleInput = await pickFirstVisible(
        [
            page.getByRole('textbox', { name: /title/i }),
            page.getByLabel(/title/i),
            page.getByPlaceholder(/title/i),
        ],
        'print title input'
    );
    await expect(titleInput).toBeVisible();

    const printTitle = 'Use Case 9 PNG Export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: /^PNG$/i });
    const pngButton = page.getByRole('button', { name: /^PNG$/i });
    const formatSelectCandidates = [
        page.getByRole('combobox', { name: /format/i }),
        page.getByLabel(/format/i),
    ];

    if (await pngRadio.first().isVisible().catch(() => false)) {
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
    } else if (await pngButton.first().isVisible().catch(() => false)) {
        const pressed = await pngButton.first().getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await pngButton.first().click();
        }
    } else {
        const formatSelect = await pickFirstVisible(formatSelectCandidates, 'print format selector');
        await expect(formatSelect).toBeVisible();

        const pngValue = await formatSelect.locator('option').evaluateAll((options) => {
            const match = options.find((option) =>
                option.textContent?.trim().toUpperCase().includes('PNG')
            );
            return match instanceof HTMLOptionElement ? match.value : null;
        });

        expect(pngValue).not.toBeNull();
        await formatSelect.selectOption(pngValue!);
        await expect.poll(() => formatSelect.inputValue()).toBe(pngValue!);
    }

    const dialogWithTitle = page.getByRole('dialog').filter({ has: titleInput });
    const regionWithTitle = page.getByRole('region').filter({ has: titleInput });

    const exportButton = await pickFirstVisible(
        [
            dialogWithTitle.getByRole('button', { name: /^Export$/i }),
            dialogWithTitle.getByRole('button', { name: /^Print$/i }),
            dialogWithTitle.getByRole('button', { name: /^Download$/i }),
            regionWithTitle.getByRole('button', { name: /^Export$/i }),
            regionWithTitle.getByRole('button', { name: /^Print$/i }),
            regionWithTitle.getByRole('button', { name: /^Download$/i }),
            page.getByRole('button', { name: /^Export$/i }),
            page.getByRole('button', { name: /^Print$/i }),
            page.getByRole('button', { name: /^Download$/i }),
        ],
        'print export button'
    );
    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const downloadPath = path.join(os.tmpdir(), suggestedFilename);
    await download.saveAs(downloadPath);

    const fileBuffer = await fs.readFile(downloadPath);
    expect(fileBuffer.length).toBeGreaterThan(1000);
    expect(Array.from(fileBuffer.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    await expect(page.getByTestId('scale-bar')).toBeVisible();
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
});
