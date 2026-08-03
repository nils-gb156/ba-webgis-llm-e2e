// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toBeVisible();
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

    const basemapSelect = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(basemapSelect).toBeVisible();

    const getDisplayedBasemap = async (): Promise<string | undefined> =>
        await basemapSelect.evaluate((element) => {
            const normalize = (value: string | null | undefined) => {
                const trimmed = value?.trim();
                return trimmed ? trimmed : undefined;
            };

            if (element instanceof HTMLSelectElement) {
                return (
                    normalize(element.selectedOptions[0]?.textContent) ||
                    normalize(element.value)
                );
            }

            if (
                element instanceof HTMLInputElement ||
                element instanceof HTMLTextAreaElement
            ) {
                return normalize(element.value);
            }

            return (
                normalize(element.getAttribute('aria-valuetext')) ||
                normalize((element as HTMLElement).innerText) ||
                normalize(element.textContent)
            );
        });

    await expect.poll(() => getActiveBaseLayerTitle(page), { timeout: 15000 }).toBe('Carto Light');
    await expect.poll(() => getDisplayedBasemap(), { timeout: 15000 }).toBe('Carto Light');

    const basemapTagName = await basemapSelect.evaluate((element) => element.tagName.toLowerCase());

    if (basemapTagName === 'select') {
        await basemapSelect.selectOption({ label: 'OpenStreetMap' });
    } else {
        await basemapSelect.click();
        const openStreetMapOption = page.getByRole('option', {
            name: 'OpenStreetMap',
            exact: true
        });
        await expect(openStreetMapOption).toBeVisible();
        await openStreetMapOption.click();
    }

    await expect.poll(() => getDisplayedBasemap(), { timeout: 15000 }).toBe('OpenStreetMap');
    await expect.poll(() => getDisplayedBasemap(), { timeout: 15000 }).not.toBe('Carto Light');

    await expect.poll(() => getActiveBaseLayerTitle(page), { timeout: 15000 }).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page), { timeout: 15000 }).not.toBe('Carto Light');
});
