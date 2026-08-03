// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const mapContainer = page.getByTestId('map-container');
    const scaleBar = page.getByTestId('scale-bar');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printingContent = page.getByTestId('printing');

    await expect(mapContainer).toBeVisible();
    await expect(scaleBar).toBeVisible();
    await expect(printToggle).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect
        .poll(async () => {
            const renderedLayers = await Promise.all([
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations'),
                isLayerRendered(page, 'UV-Index'),
                isLayerRendered(page, 'Precipitation'),
                isLayerRendered(page, 'Clouds')
            ]);
            return renderedLayers.some(Boolean);
        })
        .toBe(true);

    await expect(printingPanel).toBeHidden();
    if (!(await printingPanel.isVisible())) {
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingContent).toBeVisible();

    const title = 'Playwright PNG Export';
    let titleInput = printingPanel.getByLabel(/title/i);
    if (!(await titleInput.count())) {
        titleInput = printingPanel.getByRole('textbox').first();
    }
    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);
    await expect(titleInput).toHaveValue(title);

    const pngRadio = printingPanel.getByRole('radio', { name: /^PNG$/i });
    if (await pngRadio.count()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        let formatControl = printingPanel.getByRole('combobox', { name: /format/i });
        if (!(await formatControl.count())) {
            formatControl = printingPanel.getByLabel(/format/i);
        }

        await expect(formatControl).toBeVisible();

        const options = await formatControl.locator('option').evaluateAll((elements) =>
            elements.map((element) => ({
                label: element.textContent?.trim() ?? '',
                value: (element as HTMLOptionElement).value
            }))
        );
        const pngOption = options.find((option) => /png/i.test(option.label) || /png/i.test(option.value));

        expect(pngOption).toBeTruthy();
        await formatControl.selectOption(pngOption!.value);

        await expect
            .poll(() =>
                formatControl.locator('option').evaluateAll((elements) => {
                    const selected = elements.find(
                        (element) => (element as HTMLOptionElement).selected
                    ) as HTMLOptionElement | undefined;
                    return selected?.textContent?.trim() ?? '';
                })
            )
            .toMatch(/png/i);
    }

    let exportButton = printingPanel.getByRole('button', { name: /^Print$/i });
    if (!(await exportButton.count())) {
        exportButton = printingPanel.getByRole('button', { name: /^Export$/i });
    }
    if (!(await exportButton.count())) {
        exportButton = printingPanel.getByRole('button', { name: /^Print Map$/i });
    }
    if (!(await exportButton.count())) {
        exportButton = printingPanel.getByRole('button', { name: /^Export Map$/i });
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContent = await readFile(downloadPath!);
    expect(fileContent.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );

    await expect(scaleBar).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect
        .poll(async () => {
            const renderedLayers = await Promise.all([
                isLayerRendered(page, 'Temperature'),
                isLayerRendered(page, 'UV-Index Stations'),
                isLayerRendered(page, 'EUCOS Ground Stations'),
                isLayerRendered(page, 'UV-Index'),
                isLayerRendered(page, 'Precipitation'),
                isLayerRendered(page, 'Clouds')
            ]);
            return renderedLayers.some(Boolean);
        })
        .toBe(true);
});
