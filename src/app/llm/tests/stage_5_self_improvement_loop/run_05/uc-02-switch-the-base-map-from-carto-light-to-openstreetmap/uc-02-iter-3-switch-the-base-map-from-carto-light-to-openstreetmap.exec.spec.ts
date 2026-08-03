// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    await expect(layerSwitcherToggle).toBeVisible();

    if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

    const basemapSelector = layerSwitcher.getByRole('combobox', { name: 'Basemaps', exact: true });
    await expect(basemapSelector).toBeVisible();

    const readSelectedBasemapLabel = async (): Promise<string> =>
        await basemapSelector.evaluate((el) => {
            const normalize = (value: string | null | undefined) => value?.replace(/\s+/g, ' ').trim() ?? '';

            if (el.tagName.toLowerCase() === 'select') {
                const select = el as HTMLSelectElement;
                return normalize(select.selectedOptions[0]?.textContent);
            }

            const ariaValueText = el.getAttribute('aria-valuetext');
            const controlValue =
                'value' in el && typeof (el as HTMLInputElement | HTMLSelectElement).value === 'string'
                    ? (el as HTMLInputElement | HTMLSelectElement).value
                    : '';

            return normalize(
                ariaValueText && ariaValueText.length > 0
                    ? ariaValueText
                    : controlValue && controlValue.length > 0
                      ? controlValue
                      : el.textContent
            );
        });

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    await expect.poll(readSelectedBasemapLabel).toBe('Carto Light');

    const basemapSelectorTagName = await basemapSelector.evaluate((el) => el.tagName.toLowerCase());

    if (basemapSelectorTagName === 'select') {
        const optionLabels = await basemapSelector.evaluate((el) => {
            const select = el as HTMLSelectElement;
            return Array.from(select.options).map((option) => option.text.trim());
        });

        expect(optionLabels).toContain('Carto Light');
        expect(optionLabels).toContain('OpenStreetMap');

        await basemapSelector.selectOption({ label: 'OpenStreetMap' });
    } else {
        await basemapSelector.click();

        const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
        await expect(openStreetMapOption).toBeVisible();
        await openStreetMapOption.click();
    }

    await expect.poll(readSelectedBasemapLabel).toBe('OpenStreetMap');
    await expect.poll(readSelectedBasemapLabel).not.toBe('Carto Light');

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
