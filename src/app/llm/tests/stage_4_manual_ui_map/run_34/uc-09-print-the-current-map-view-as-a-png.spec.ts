// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }, testInfo) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const scaleBar = page.getByTestId('scale-bar');

    await expect(mapContainer).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect
        .poll(async () => {
            const visibleOperationalLayers = await Promise.all([
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations')
            ]);
            return visibleOperationalLayers.filter(Boolean).length;
        })
        .toBeGreaterThan(0);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();

    let printingScope = printingPanel;
    const printingContent = page.getByTestId('printing');
    if ((await printingContent.count()) > 0) {
        await expect(printingContent).toBeVisible();
        printingScope = printingContent;
    }

    const selectPngFormat = async (control: Locator): Promise<boolean> => {
        const pngOptions = [
            { label: 'PNG' },
            { value: 'png' },
            { label: 'image/png' },
            { value: 'image/png' },
            { value: 'PNG' }
        ];

        for (const option of pngOptions) {
            try {
                await control.selectOption(option);
                return true;
            } catch {
                // try next representation
            }
        }

        try {
            await control.click();
            const pngOption = page.getByRole('option', { name: /png/i });
            if ((await pngOption.count()) > 0) {
                await pngOption.first().click();
                return true;
            }
        } catch {
            // fall through to "not selected"
        }

        return false;
    };

    const printTitle = 'Current weather map';

    const titleInputByLabel = printingScope.getByLabel(/title/i);
    const titleInputByRole = printingScope.getByRole('textbox', { name: /title/i });
    if ((await titleInputByLabel.count()) > 0) {
        await expect(titleInputByLabel.first()).toBeVisible();
        await titleInputByLabel.first().fill(printTitle);
    } else if ((await titleInputByRole.count()) > 0) {
        await expect(titleInputByRole.first()).toBeVisible();
        await titleInputByRole.first().fill(printTitle);
    } else {
        const genericTextbox = printingScope.getByRole('textbox').first();
        await expect(genericTextbox).toBeVisible();
        await genericTextbox.fill(printTitle);
    }

    let pngSelected = false;
    const pngRadio = printingScope.getByRole('radio', { name: /png/i });
    const formatComboboxByRole = printingScope.getByRole('combobox', { name: /format/i });
    const formatControlByLabel = printingScope.getByLabel(/format/i);

    if ((await pngRadio.count()) > 0) {
        await expect(pngRadio.first()).toBeVisible();
        await pngRadio.first().click({ force: true });
        await expect(pngRadio.first()).toBeChecked();
        pngSelected = true;
    } else if ((await formatComboboxByRole.count()) > 0) {
        await expect(formatComboboxByRole.first()).toBeVisible();
        pngSelected = await selectPngFormat(formatComboboxByRole.first());
    } else if ((await formatControlByLabel.count()) > 0) {
        await expect(formatControlByLabel.first()).toBeVisible();
        pngSelected = await selectPngFormat(formatControlByLabel.first());
    } else {
        const allComboboxes = printingScope.getByRole('combobox');
        const comboboxCount = await allComboboxes.count();

        for (let index = 0; index < comboboxCount; index++) {
            const candidate = allComboboxes.nth(index);
            const candidateText = ((await candidate.textContent()) ?? '').toLowerCase();
            if (candidateText.includes('png')) {
                pngSelected = await selectPngFormat(candidate);
                if (pngSelected) {
                    break;
                }
            }
        }
    }

    expect(pngSelected).toBe(true);

    const downloadPromise = page.waitForEvent('download');
    const exportButton = printingScope.getByRole('button', { name: /export|print|download/i }).first();

    await expect(exportButton).toBeVisible();
    await exportButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.png$/);

    const outputPath = testInfo.outputPath('printed-map.png');
    await download.saveAs(outputPath);
    expect(await download.failure()).toBeNull();

    const fileBytes = await readFile(outputPath);
    expect(fileBytes.length).toBeGreaterThan(100);
    expect(fileBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(
        true
    );
});
