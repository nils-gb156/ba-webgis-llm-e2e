// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and the default base layer to be set
    await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

    // 1. The user opens the base map selector in the layer switcher.
    // The layer switcher is visible by default, so we just need to find the dropdown control.
    // Based on the UI map, the basemaps control is a dropdown inside the layer-switcher.
    const layerSwitcher = page.getByTestId('layer-switcher');
    // We look for a select/dropdown within the layer switcher.
    // Since no specific test id is given for the dropdown itself, we use getByRole('combobox') or similar.
    // However, Chakra UI dropdowns might render as buttons. Let's look for the container.
    // The prompt implies a "dropdown" controlType. We'll try to find a select or a button that opens a menu.
    // Given the structure, let's assume there is a way to interact with the basemap selection.
    // Often, these are rendered as a Select component.
    const basemapSelect = layerSwitcher.getByRole('combobox').first();
    await basemapSelect.click();

    // Wait for the options to appear
    await page.getByText('OpenStreetMap').waitFor({ state: 'visible' });

    // 2. The user selects 'OpenStreetMap' as the base map.
    await page.getByText('OpenStreetMap').click();

    // Expected results: The OpenStreetMap base map is selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
