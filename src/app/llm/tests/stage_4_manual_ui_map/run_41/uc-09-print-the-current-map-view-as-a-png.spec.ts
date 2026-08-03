// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toMatch(
        /^(Carto Light|Carto Dark|OpenStreetMap)$/
    );

    await expect
        .poll(async () => {
            const rendered = await Promise.all([
                isLayerRendered(page, 'UV-Index'),
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'Precipitation'),
                isLayerRendered(page, 'Clouds'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations')
            ]);
            return rendered.some(Boolean);
        })
        .toBe(true);

    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');

    await expect(printToggle).toBeVisible();
    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingPanel.getByTestId('printing')).toBeVisible();

    const title = 'Playwright PNG export';
    let titleInput = printingPanel.getByRole('textbox', { name: /title/i });
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByLabel(/title/i);
    }
    if ((await titleInput.count()) === 0) {
        titleInput = printingPanel.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);

    const pngRadio = printingPanel.getByRole('radio', { name: /^png$/i });
    if ((await pngRadio.count()) > 0) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let formatControl = printingPanel.getByRole('combobox', {
            name: /format|file format|type/i
        });
        if ((await formatControl.count()) === 0) {
            formatControl = printingPanel.getByLabel(/format|file format|type/i);
        }
        if ((await formatControl.count()) === 0) {
            formatControl = printingPanel.getByRole('combobox').first();
        }

        await expect(formatControl).toBeVisible();

        const tagName = await formatControl.evaluate((element) => element.tagName.toLowerCase());
        if (tagName === 'select') {
            const options = await formatControl.evaluate((element) =>
                Array.from((element as HTMLSelectElement).options).map((option) => ({
                    label: option.label,
                    value: option.value
                }))
            );

            const pngOption = options.find(
                (option) => /png/i.test(option.label) || /png/i.test(option.value)
            );
            expect(pngOption).toBeTruthy();

            await formatControl.selectOption(pngOption!.value);

            await expect
                .poll(() =>
                    formatControl.evaluate(
                        (element) =>
                            (element as HTMLSelectElement).selectedOptions[0]?.textContent?.trim() ??
                            ''
                    )
                )
                .toMatch(/png/i);
        } else {
            await formatControl.click();
            const pngOption = page.getByRole('option', { name: /^png$/i });
            await expect(pngOption).toBeVisible();
            await pngOption.click();
        }
    }

    const exportButtonCandidates = [
        printingPanel.getByRole('button', { name: /^Export$/i }),
        printingPanel.getByRole('button', { name: /^Print$/i }),
        printingPanel.getByRole('button', { name: /export/i }),
        printingPanel.getByRole('button', { name: /print/i }),
        printingPanel.getByRole('button', { name: /download/i })
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

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    if (!downloadPath) {
        throw new Error('Downloaded file path is unavailable.');
    }

    const [fileStats, fileContent] = await Promise.all([stat(downloadPath), readFile(downloadPath)]);
    expect(fileStats.size).toBeGreaterThan(0);
    expect(
        fileContent
            .subarray(0, 8)
            .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe(true);
});
