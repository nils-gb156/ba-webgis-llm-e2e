// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const printToggle = page.getByTestId('print-toggle');
    const printingPanel = page.getByTestId('printing-panel');
    const printingContent = page.getByTestId('printing');
    const scaleBar = page.getByTestId('scale-bar');

    await expect(mapContainer).toBeVisible();
    await expect(printToggle).toBeVisible();
    await expect(scaleBar).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect
        .poll(async () => {
            return (
                (await isLayerRendered(page, 'Temperature')) ||
                (await isLayerRendered(page, 'UV-Index Stations')) ||
                (await isLayerRendered(page, 'EUCOS Ground Stations'))
            );
        })
        .toBe(true);

    if (!(await printingPanel.isVisible())) {
        const pressed = await printToggle.getAttribute('aria-pressed');
        expect(pressed).not.toBe('true');
        await printToggle.click();
    }

    await expect(printingPanel).toBeVisible();
    await expect(printingContent).toBeVisible();

    let titleInputs = printingPanel.getByRole('textbox', { name: /title/i });
    if ((await titleInputs.count()) === 0) {
        titleInputs = printingPanel.getByRole('textbox');
    }
    const titleInput = titleInputs.first();
    const printTitle = 'Use Case 9 PNG Export';

    await expect(titleInput).toBeVisible();
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = printingPanel.getByRole('radio', { name: /^PNG$/i });
    if ((await pngRadio.count()) > 0) {
        const pngRadioButton = pngRadio.first();
        await pngRadioButton.click({ force: true });
        await expect(pngRadioButton).toBeChecked();
    } else {
        let formatControls = printingPanel.getByRole('combobox', { name: /format/i });
        if ((await formatControls.count()) === 0) {
            formatControls = printingPanel.getByRole('combobox');
        }
        const formatControl = formatControls.first();

        await expect(formatControl).toBeVisible();

        const tagName = await formatControl.evaluate((el) => el.tagName);
        if (tagName === 'SELECT') {
            const pngValue = await formatControl.evaluate((el) => {
                const select = el as unknown as {
                    options?: ArrayLike<{ label?: string; text?: string; value?: string }>;
                };
                const options = Array.from(select.options ?? []);
                const option = options.find(
                    (entry) =>
                        /png/i.test(entry.label ?? '') ||
                        /png/i.test(entry.text ?? '') ||
                        /png/i.test(entry.value ?? '')
                );
                return option?.value;
            });

            expect(pngValue).toBeTruthy();
            await formatControl.selectOption(pngValue!);
        } else {
            await formatControl.click();

            const pngOption = page.getByRole('option', { name: /^PNG$/i });
            if ((await pngOption.count()) > 0) {
                await pngOption.first().click();
            } else {
                const pngMenuItem = page.getByRole('menuitemradio', { name: /^PNG$/i });
                if ((await pngMenuItem.count()) > 0) {
                    await pngMenuItem.first().click();
                } else {
                    const pngButton = page.getByRole('button', { name: /^PNG$/i });
                    if ((await pngButton.count()) > 0) {
                        await pngButton.first().click();
                    } else {
                        throw new Error('Could not find a PNG format option in the printing panel.');
                    }
                }
            }
        }

        await expect
            .poll(() =>
                formatControl.evaluate((el) => {
                    const control = el as unknown as { value?: string; textContent?: string | null };
                    return `${control.value ?? ''} ${control.textContent ?? ''}`;
                })
            )
            .toMatch(/png/i);
    }

    await expect(scaleBar).toBeVisible();
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect
        .poll(async () => {
            return (
                (await isLayerRendered(page, 'Temperature')) ||
                (await isLayerRendered(page, 'UV-Index Stations')) ||
                (await isLayerRendered(page, 'EUCOS Ground Stations'))
            );
        })
        .toBe(true);

    let exportButtons = printingPanel.getByRole('button', { name: /^export$/i });
    if ((await exportButtons.count()) === 0) {
        exportButtons = printingPanel.getByRole('button', { name: /^download$/i });
    }
    if ((await exportButtons.count()) === 0) {
        exportButtons = printingPanel.getByRole('button', { name: /^print$/i });
    }
    if ((await exportButtons.count()) === 0) {
        exportButtons = printingPanel.getByRole('button', { name: /export|download|print/i });
    }

    let exportButton = exportButtons.first();
    if ((await exportButtons.count()) === 0) {
        const allButtons = printingPanel.getByRole('button');
        expect(await allButtons.count()).toBeGreaterThan(0);
        exportButton = allButtons.last();
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.png$/i);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();

    const fileContents = await readFile(downloadPath!);
    expect(fileContents.length).toBeGreaterThan(100);
    expect(
        fileContents
            .subarray(0, 8)
            .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe(true);
});
