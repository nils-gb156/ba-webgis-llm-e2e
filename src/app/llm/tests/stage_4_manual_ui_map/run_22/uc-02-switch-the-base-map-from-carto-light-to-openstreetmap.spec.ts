// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from "../../../map-model-helpers";

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and initial base layer to settle
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    // Step 1: The user opens the base map selector in the layer switcher.
    // The layer switcher is visible by default.
    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    // The base map selector is a dropdown within the layer switcher.
    // We look for the dropdown trigger. Based on typical Chakra UI patterns,
    // the dropdown might be represented by a button or the select element itself.
    // Since we don't have a specific test-id for the dropdown trigger, we look for
    // the currently selected value or a generic dropdown container.
    // However, the prompt implies we should use getByTestId if available.
    // The UI map doesn't explicitly give a test-id for the dropdown trigger,
    // but it gives "data-testid": "layer-switcher" for the whole component.
    // Let's assume the dropdown is inside. We can try to find the dropdown by role.
    // Chakra UI's Select renders a button-like element.
    const baseMapDropdown = layerSwitcher.getByRole('combobox', { name: /Base Map/i });
    
    // If the name is not specific enough, we might need to look for the select element directly.
    // Let's try to click the dropdown. If it's a Chakra Select, it might have a test-id or we can use getByRole.
    // Given the UI map doesn't specify a test-id for the dropdown itself, we'll use getByRole.
    // We need to be careful with the name. Let's try to find the dropdown.
    // Often, the dropdown trigger has the current value as its accessible name or part of it.
    // Let's try clicking the layer switcher's dropdown.
    // If the dropdown doesn't have a clear accessible name, we might need to rely on the structure.
    // Let's assume there is a dropdown inside the layer-switcher.
    
    // Alternative: The UI map says "controlType": "dropdown" for basemaps.
    // Let's try to find the dropdown by its role and a likely name.
    // If that fails, we might need to look for the select element.
    
    // Let's try to find the dropdown.
    const dropdown = layerSwitcher.getByRole('button', { name: /Carto Light/i }).first();
    // Or maybe it's a select element.
    // Let's try to find the select element.
    const selectElement = layerSwitcher.locator('select').first();
    
    // If the select element is not visible or interactive, we might need to click a button.
    // Let's try clicking the button that shows the current selection.
    // If the button is not found, we'll try the select element.
    
    // Let's assume the dropdown is triggered by a button with the current value.
    // If that's not the case, we might need to look for the select element.
    
    // Let's try to find the dropdown by looking for the options.
    // Since we can't see the options until the dropdown is open, we'll try to open it.
    
    // Let's try to click the layer switcher's dropdown trigger.
    // We'll use the button that likely represents the current selection.
    await dropdown.click();

    // Step 2: The user selects 'OpenStreetMap' as the base map.
    // The dropdown should now be open. We look for the 'OpenStreetMap' option.
    const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
    await expect(osmOption).toBeVisible();
    await osmOption.click();

    // Expected results:
    // - The OpenStreetMap base map is selected.
    // - The Carto Light base map is no longer selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
