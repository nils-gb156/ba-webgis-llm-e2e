// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';

test('UC9: Print the current map view as a PNG', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();
    await expect(page.getByTestId('map-toolbar')).toBeVisible();

    // Preconditions: the application is loaded and a basemap plus overlay layers are visible.
    await expect(page.getByRole('combobox', { name: 'Basemaps', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Temperature', exact: true })).toBeChecked();
    await expect(page.getByTestId('temperature-legend')).toBeVisible();
    await expect(page.getByTestId('scale-bar')).toBeVisible();

    const printToggle = page.getByTestId('print-toggle');
    await expect(printToggle).toBeVisible();

    const titleByRole = page.getByRole('textbox', { name: /title/i });
    const titleByLabel = page.getByLabel(/title/i);
    const titleByPlaceholder = page.getByPlaceholder(/title/i);

    if (
        !(await titleByRole.isVisible()) &&
        !(await titleByLabel.isVisible()) &&
        !(await titleByPlaceholder.isVisible())
    ) {
        await printToggle.click();
    }

    await expect.poll(async () => {
        return (
            (await titleByRole.isVisible()) ||
            (await titleByLabel.isVisible()) ||
            (await titleByPlaceholder.isVisible())
        );
    }).toBe(true);

    const titleInput = (await titleByRole.isVisible())
        ? titleByRole
        : (await titleByLabel.isVisible())
          ? titleByLabel
          : titleByPlaceholder;

    await expect(titleInput).toBeVisible();

    const printTitle = 'Weather Map PNG Export';
    await titleInput.fill(printTitle);
    await expect(titleInput).toHaveValue(printTitle);

    const pngRadio = page.getByRole('radio', { name: /^png$/i });
    const formatByRole = page.getByRole('combobox', { name: /format/i });
    const formatByLabel = page.getByLabel(/format/i);

    await expect.poll(async () => {
        return (
            (await pngRadio.isVisible()) ||
            (await formatByRole.isVisible()) ||
            (await formatByLabel.isVisible())
        );
    }).toBe(true);

    if (await pngRadio.isVisible()) {
        await pngRadio.click({ force: true });
        await expect(pngRadio).toBeChecked();
    } else {
        const formatControl = (await formatByRole.isVisible()) ? formatByRole : formatByLabel;
        await expect(formatControl).toBeVisible();

        const tagName = await formatControl.evaluate((element) => element.tagName.toLowerCase());

        if (tagName === 'select') {
            await formatControl.selectOption({ label: 'PNG' });
        } else {
            await formatControl.click();

            const pngOption = page.getByRole('option', { name: /^png$/i });
            const pngMenuItemRadio = page.getByRole('menuitemradio', { name: /^png$/i });
            const pngButton = page.getByRole('button', { name: /^png$/i });

            await expect.poll(async () => {
                return (
                    (await pngOption.isVisible()) ||
                    (await pngMenuItemRadio.isVisible()) ||
                    (await pngButton.isVisible())
                );
            }).toBe(true);

            if (await pngOption.isVisible()) {
                await pngOption.click();
            } else if (await pngMenuItemRadio.isVisible()) {
                await pngMenuItemRadio.click({ force: true });
            } else {
                await pngButton.click();
            }
        }

        await expect.poll(() =>
            formatControl.evaluate((element) => {
                if (element instanceof HTMLSelectElement) {
                    return element.selectedOptions[0]?.label ?? '';
                }
                return (element.textContent ?? '').trim();
            })
        ).toMatch(/png/i);
    }

    const printDialog = page.getByRole('dialog').first();
    let exportButton = page.getByRole('button', { name: /^(Export( Map)?|Print|Download|Generate)$/i });
    if (await printDialog.isVisible()) {
        exportButton = printDialog.getByRole('button', { name: /^(Export( Map)?|Print|Download|Generate)$/i });
    }

    await expect(exportButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;

    await expect.poll(() => download.failure()).toBeNull();

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.png$/i);

    const outputPath = test.info().outputPath(suggestedFilename);
    await download.saveAs(outputPath);

    const fileInfo = await stat(outputPath);
    expect(fileInfo.size).toBeGreaterThan(0);

    const fileContent = await readFile(outputPath);
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(fileContent.subarray(0, 8).equals(pngSignature)).toBe(true);
});
