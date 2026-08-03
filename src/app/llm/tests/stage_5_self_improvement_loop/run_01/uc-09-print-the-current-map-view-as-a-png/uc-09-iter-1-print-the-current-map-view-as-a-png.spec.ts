// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    test.setTimeout(60000);

    const firstVisible = async (candidates: Locator[]): Promise<Locator | undefined> => {
        for (const candidate of candidates) {
            if ((await candidate.count()) > 0) {
                const first = candidate.first();
                if (await first.isVisible().catch(() => false)) {
                    return first;
                }
            }
        }
        return undefined;
    };

    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();
    await expect(printToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const globalTitleCandidates = [
        page.getByRole('textbox', { name: /title/i }),
        page.getByLabel(/title/i),
        page.getByPlaceholder(/title/i)
    ];

    let titleInput = await firstVisible(globalTitleCandidates);

    if (!titleInput) {
        await printToggle.click();

        await expect
            .poll(async () => {
                const visibleTitle = await firstVisible(globalTitleCandidates);
                const dialogVisible = await page.getByRole('dialog').first().isVisible().catch(() => false);
                return dialogVisible || visibleTitle !== undefined;
            })
            .toBe(true);
    }

    const printDialog = page.getByRole('dialog').first();
    const dialogVisible = await printDialog.isVisible().catch(() => false);
    const panelRoot: Page | Locator = dialogVisible ? printDialog : page;

    if (dialogVisible) {
        await expect(printDialog).toBeVisible();
    }

    titleInput = await firstVisible([
        panelRoot.getByRole('textbox', { name: /title/i }),
        panelRoot.getByLabel(/title/i),
        panelRoot.getByPlaceholder(/title/i)
    ]);

    if (!titleInput) {
        throw new Error('Print panel did not expose a visible title input.');
    }

    await expect(titleInput).toBeVisible();
    await titleInput.fill('Current Weather Map');

    const pngRadio = panelRoot.getByRole('radio', { name: /^PNG$/i });
    const pngButton = panelRoot.getByRole('button', { name: /^PNG$/i });
    const formatCombobox = await firstVisible([
        panelRoot.getByRole('combobox', { name: /format/i }),
        panelRoot.getByLabel(/format/i)
    ]);

    if ((await pngRadio.count()) > 0 && (await pngRadio.first().isVisible().catch(() => false))) {
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
    } else if (formatCombobox) {
        await expect(formatCombobox).toBeVisible();

        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            try {
                await formatCombobox.selectOption({ value: 'png' });
            } catch {
                await formatCombobox.click();
                const pngOption = panelRoot.getByRole('option', { name: /^PNG$/i });
                await expect(pngOption).toBeVisible();
                await pngOption.click();
            }
        }

        await expect
            .poll(async () => {
                const value = await formatCombobox.inputValue().catch(() => '');
                if (value) {
                    return value;
                }
                return (await formatCombobox.textContent()) ?? '';
            })
            .toMatch(/png/i);
    } else if ((await pngButton.count()) > 0 && (await pngButton.first().isVisible().catch(() => false))) {
        const pngButtonFirst = pngButton.first();
        const pressedBefore = await pngButtonFirst.getAttribute('aria-pressed');

        if (pressedBefore !== 'true') {
            await pngButtonFirst.click();
        }

        const pressedAfter = await pngButtonFirst.getAttribute('aria-pressed');
        if (pressedBefore !== null || pressedAfter !== null) {
            await expect(pngButtonFirst).toHaveAttribute('aria-pressed', 'true');
        } else {
            await expect(pngButtonFirst).toBeVisible();
        }
    } else {
        throw new Error('Print panel did not expose a PNG format control.');
    }

    await expect(scaleBar).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const exportCandidates: Locator[] = [
        panelRoot.getByRole('button', { name: /^Export$/i }),
        panelRoot.getByRole('button', { name: /^Download$/i }),
        panelRoot.getByRole('button', { name: /^Print$/i }),
        panelRoot.getByRole('button', { name: /^Create$/i }),
        panelRoot.getByRole('button', { name: /^Generate$/i })
    ];

    if (dialogVisible) {
        exportCandidates.push(printDialog.getByRole('button', { name: /^Print Map$/i }));
    }

    const exportButton = await firstVisible(exportCandidates);

    if (!exportButton) {
        throw new Error('Print panel did not expose a visible export button.');
    }

    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    if (!downloadPath) {
        throw new Error('Expected a downloaded PNG file, but no download path was available.');
    }

    const fileContent = await readFile(downloadPath);
    expect(fileContent.byteLength).toBeGreaterThan(1000);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    const width = fileContent.readUInt32BE(16);
    const height = fileContent.readUInt32BE(20);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
});
