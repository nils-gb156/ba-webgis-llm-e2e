// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Verify initial state: Carto Light should be active
    await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

    // Step 1: Open the base map selector in the layer switcher
    // The layer switcher is visible by default, so we click the toggle to ensure it's open
    // or simply interact with the dropdown inside it.
    // Looking at the UI map, "basemaps" is a dropdown inside "layer-switcher".
    // We need to click the layer switcher toggle if it's closed, but it's visibleByDefault.
    // Let's assume the dropdown is inside the layer-switcher panel.
    // We will click the layer-switcher-toggle to ensure the panel is open, then click the dropdown.
    // However, the prompt says "layer switcher (TOC) is visible".
    // Let's click the layer-switcher-toggle to make sure the panel is visible/open.
    // Note: The toggle button toggles the visibility. If it's already visible, clicking might close it.
    // But the UI map says "visibleByDefault": true for layer-switcher.
    // Let's just click the dropdown directly if it's visible.
    // Actually, let's look at the structure. layer-switcher contains basemaps (dropdown).
    // We can try to click the dropdown.
    
    // To be safe and follow the "toggles" logic:
    // The layer-switcher-toggle toggles the layer-switcher panel.
    // Since it is visibleByDefault, we don't strictly need to open it, but we might need to interact with it.
    // Let's click the layer-switcher-toggle to ensure it's open, then click the dropdown.
    // If it closes, we click again.
    // A simpler approach: Click the dropdown directly.
    
    // Let's check if there's a specific test id for the basemaps dropdown.
    // The UI map says: "basemaps": { "controlType": "dropdown", ... }
    // It doesn't explicitly give a data-testid for the dropdown itself, but it's inside layer-switcher.
    // Let's assume we can find it by role or text.
    // "basemaps" is a section. The dropdown likely has a label or test id.
    // Let's look for "Basemaps" text or similar.
    // Or we can use the fact that it's a dropdown.
    
    // Let's try clicking the layer-switcher-toggle to ensure the panel is open.
    // If it's already open, this might close it.
    // Let's check the current state of the toggle button.
    // The toggle button has `toggles: "layer-switcher"`.
    // If the panel is visible, the button is likely `aria-pressed="true"`.
    // We should only click if it's not pressed.
    
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const isLayerSwitcherOpen = await layerSwitcherToggle.getAttribute('aria-pressed');
    
    if (isLayerSwitcherOpen !== 'true') {
        await layerSwitcherToggle.click();
    }

    // Now click the basemaps dropdown.
    // We need to find the dropdown. It's inside layer-switcher.
    // Let's look for a button or select with "Basemaps" or similar.
    // Since no explicit test id is given for the dropdown, we use getByRole or getByText.
    // Let's assume the dropdown has a label "Basemaps".
    const basemapsDropdown = page.getByTestId('layer-switcher').getByRole('combobox', { name: /Basemaps/i, exact: false });
    // If getByRole doesn't work, try getByText.
    // Let's try to click the first option or the dropdown itself.
    
    // Alternative: The UI map says "basemaps" is a dropdown.
    // Let's try to click the element with test id if we can infer it.
    // No test id provided for the dropdown.
    // Let's use getByRole('combobox') or getByRole('listbox') if it's a custom dropdown.
    // Chakra UI Select uses a button with aria-expanded.
    
    // Let's try to find the dropdown by its position or label.
    // Let's assume the label is "Basemaps".
    const dropdownButton = page.getByTestId('layer-switcher').getByRole('button', { name: /Basemaps/i });
    
    // If the above fails, we might need to look for the dropdown container.
    // Let's try clicking the dropdown button.
    await dropdownButton.click();

    // Step 2: Select 'OpenStreetMap'
    // The dropdown should now be open. We look for the option "OpenStreetMap".
    const osmOption = page.getByTestId('layer-switcher').getByRole('option', { name: 'OpenStreetMap' });
    await osmOption.click();

    // Expected results: OpenStreetMap base map is selected.
    await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
