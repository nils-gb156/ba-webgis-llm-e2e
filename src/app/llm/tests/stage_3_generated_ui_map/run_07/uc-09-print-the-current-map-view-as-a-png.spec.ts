// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('UC9 - Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printingContent = page.getByTestId('printing');

    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();
    await expect(printToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingContent).toBeVisible();

    const titledTextbox = printingPanel.getByRole('textbox', { name: /title/i });
    const titleInput =
        (await titledTextbox.count()) > 0 ? titledTextbox : printingPanel.getByRole('textbox').first();

    const printTitle = 'Current Weather Map';
    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i });
    const namedFormatCombobox = printingPanel.getByRole('combobox', { name: /format/i });
    const anyFormatCombobox = printingPanel.getByRole('combobox');
    const pngButton = printingPanel.getByRole('button', { name: /^png$/i });

    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else if ((await namedFormatCombobox.count()) > 0 || (await anyFormatCombobox.count()) > 0) {
        const formatCombobox =
            (await namedFormatCombobox.count()) > 0
                ? namedFormatCombobox.first()
                : anyFormatCombobox.first();

        await expect(formatCombobox).toBeVisible();
        try {
            await formatCombobox.selectOption({ label: 'PNG' });
        } catch {
            await formatCombobox.selectOption('png');
        }
        await expect(formatCombobox).toHaveValue(/png/i);
    } else if ((await pngButton.count()) > 0) {
        await pngButton.first().click();
    } else {
        throw new Error('Could not find a control to select the PNG format in the printing panel.');
    }

    await expect(scaleBar).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

    const exportButtonCandidates = [
        printingPanel.getByRole('button', { name: /^(export|print|download)$/i }),
        printingPanel.getByRole('button', { name: /(export|print|download)/i })
    ];

    let exportButton = exportButtonCandidates[0].first();
    for (const candidate of exportButtonCandidates) {
        if ((await candidate.count()) > 0) {
            exportButton = candidate.first();
            break;
        }
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    const fileContent = await readFile(downloadPath);
    expect(fileContent.length).toBeGreaterThan(8);
    expect(Array.from(fileContent.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
