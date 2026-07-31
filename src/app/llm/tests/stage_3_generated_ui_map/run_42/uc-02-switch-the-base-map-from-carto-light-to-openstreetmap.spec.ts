// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map model to be ready and Carto Light to be active
    await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

    // The layer switcher is visible by default.
    // Open the base map selector. In Open Pioneer Trails, this is typically a dropdown or radio group within the layer switcher.
    // We look for the base layer selector control. If a specific test id isn't known, we use the role.
    // Assuming the base map selector is exposed as a group or list within the layer switcher.
    const layerSwitcher = page.getByTestId('layer-switcher');
    
    // Click the base map selector. Often this is a button or a specific section.
    // If there's a specific toggle for base maps, we click it. Otherwise, we assume the UI allows selecting base maps directly.
    // Based on typical Open Pioneer Trails UI, base maps are often radio buttons or a dropdown.
    // Let's try to find the OpenStreetMap option directly or the selector first.
    // Since we don't have a specific test id for the base map selector button, we rely on the layer switcher being open.
    
    // Attempt to select OpenStreetMap. It might be a radio button or a list item.
    const osmOption = page.getByRole('radio', { name: 'OpenStreetMap', exact: true }).first();
    
    // If the radio button exists and is not checked, click it.
    // If it's a dropdown, we might need to click a button first.
    // Let's try clicking the radio button directly. If it fails, we might need to find the dropdown.
    // However, the prompt implies a standard layer switcher. Let's assume there's a way to select it.
    // If 'OpenStreetMap' is a radio button:
    await osmOption.click({ force: true });

    // Verify that OpenStreetMap is now the active base layer
    await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
