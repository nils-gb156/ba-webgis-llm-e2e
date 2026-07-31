// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify initial state: Carto Light is active
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Step 1: Open the base map selector in the layer switcher
    const layerSwitcher = page.getByTestId('layer-switcher');
    await layerSwitcher.waitFor({ state: 'visible' });

    // The base map selector is a dropdown within the layer switcher.
    // We look for the dropdown trigger. Based on typical Chakra UI patterns,
    // it might be a button or the select itself. Let's try to find the dropdown
    // container or the select element. Since we don't have a specific test id for
    // the base map dropdown, we look for a select or a button with "Base map" or similar.
    // However, looking at the UI map, there is no specific test id for the base map selector
    // inside the layer switcher. We need to infer its location.
    // Usually, the layer switcher contains sections. Let's assume the base map selection
    // is a dropdown/select element inside the layer switcher.
    // We will try to find a select element or a button that opens a list of base maps.
    // Given the UI map says "controlType": "dropdown", let's look for a select or a combobox.
    // If not found, we might need to click the layer switcher toggle if it's collapsed,
    // but the UI map says layer-switcher is visibleByDefault: true.
    
    // Let's try to find the base map dropdown. It's likely a select or a Chakra select component.
    // We'll try to get the select element by its label or role if possible.
    // Since we don't have a test id, we'll try getByRole('combobox') or getByRole('listbox')
    // or simply look for a select element within the layer switcher.
    
    // Attempt 1: Look for a select element
    const baseMapSelect = layerSwitcher.locator('select').first();
    if (await baseMapSelect.isVisible()) {
        // Select OpenStreetMap
        await baseMapSelect.selectOption('OpenStreetMap');
    } else {
        // Attempt 2: Look for a button or div that acts as a dropdown trigger
        // Often in Chakra, a select is rendered as a div with role="combobox"
        const baseMapCombobox = layerSwitcher.getByRole('combobox').first();
        if (await baseMapCombobox.isVisible()) {
            await baseMapCombobox.click();
            // Wait for the listbox to appear
            const listBox = page.getByRole('listbox');
            await listBox.waitFor({ state: 'visible' });
            // Select OpenStreetMap
            await page.getByRole('option', { name: 'OpenStreetMap' }).click();
        } else {
            // Attempt 3: Look for a button with text "Base Map" or similar
            const baseMapButton = layerSwitcher.getByText('Base Map').first();
            if (await baseMapButton.isVisible()) {
                await baseMapButton.click();
                // Wait for the listbox to appear
                const listBox = page.getByRole('listbox');
                await listBox.waitFor({ state: 'visible' });
                // Select OpenStreetMap
                await page.getByRole('option', { name: 'OpenStreetMap' }).click();
            } else {
                // Fallback: Try to find any dropdown-like element in the layer switcher
                // This is a bit of a guess, but we need to interact with the base map selector
                const dropdownTrigger = layerSwitcher.locator('div').filter({ hasText: 'Carto Light' }).first();
                if (await dropdownTrigger.isVisible()) {
                    await dropdownTrigger.click();
                    const listBox = page.getByRole('listbox');
                    await listBox.waitFor({ state: 'visible' });
                    await page.getByRole('option', { name: 'OpenStreetMap' }).click();
                } else {
                    throw new Error('Could not find base map selector in layer switcher');
                }
            }
        }
    }

    // Step 2: Verify that OpenStreetMap is now active
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
