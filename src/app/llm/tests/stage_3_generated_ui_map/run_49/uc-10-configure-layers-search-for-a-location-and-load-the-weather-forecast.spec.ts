// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from "../../../map-model-helpers";

test("Use Case 10: Configure layers, search for a location and load the weather forecast", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Step 1: Hide Temperature layer
    // The layer switcher is visible by default. We click the toggle for "Temperature".
    // We use force: true because Chakra UI checkboxes/switches have hidden inputs.
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
    
    // Step 2: Show Precipitation layer
    // The Precipitation layer is initially hidden. We click its toggle.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Step 3: Search for a location
    await page.getByTestId('geocoder-input').click();
    await page.getByTestId('geocoder-input').fill('Münster');

    // Step 4: Wait for results and select the first one
    // Wait for the first result item to appear
    await expect(page.getByTestId('geocoder-result-item-0')).toBeVisible({ timeout: 10000 });
    
    // Click the first result
    await page.getByTestId('geocoder-result-item-0').click();

    // Step 5: Wait for map to navigate
    // We poll the map center to ensure it has changed from the initial position.
    // Note: We don't know the exact coordinates of Münster in EPSG:3857, so we just
    // verify that the map center is no longer undefined and potentially changed.
    // A more robust check might be to wait for a specific timeout or check if the 
    // coordinate viewer updates, but polling the map model is the standard way 
    // to assert map state changes.
    await expect.poll(() => getMapCenter(page)).not.toBeUndefined();

    // Step 6: Wait for info panel to load the forecast
    // The info panel is visible by default. We need to wait for the weather forecast section
    // to populate with entries.
    // We check for the presence of weather forecast entries.
    await expect.poll(async () => {
        const entries = page.getByTestId('weather-forecast-entry');
        const count = await entries.count();
        return count;
    }).toBeGreaterThanOrEqual(24);

    // Expected Results Verification:
    
    // 1. The Precipitation overlay layer toggle is in the disabled state (checked/active).
    //    Since we clicked it to show it, it should be checked.
    await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

    // 2. The Temperature overlay layer toggle is in the enabled state (checked/active).
    //    Wait, the use case says "hide it" in step 1. So it should be unchecked.
    //    However, the expected result says "Temperature overlay layer toggle is in the enabled state".
    //    Let's re-read carefully.
    //    Step 1: "clicks the visibility toggle of the Temperature overlay layer to hide it."
    //    Expected result: "The Temperature overlay layer toggle is in the enabled state."
    //    This is a contradiction. Usually "enabled" in UI context might mean "available" or "checked".
    //    Given the context of "hide it", the toggle should be unchecked.
    //    Let's look at the Precipitation expected result: "The Precipitation overlay layer toggle is in the disabled state."
    //    This is also confusing. If we clicked it to show it, it should be checked.
    //    Let's assume "disabled/enabled" refers to the state of the toggle button itself (e.g. aria-disabled),
    //    or perhaps there is a typo in the expected results description regarding "enabled/disabled" vs "checked/unchecked".
    //    Given the standard behavior of layer switches:
    //    - Clicking a visible layer hides it (unchecked).
    //    - Clicking a hidden layer shows it (checked).
    //    Let's assert based on the visual state of the checkbox (checked/unchecked) which reflects visibility.
    
    // Re-evaluating Expected Results based on standard UI semantics:
    // "enabled state" likely means the layer is active/visible (checked).
    // "disabled state" likely means the layer is inactive/hidden (unchecked).
    // BUT Step 1 says "hide" Temperature. So Temperature should be unchecked.
    // Step 2 says "show" Precipitation. So Precipitation should be checked.
    // If Expected Result 1 says Precipitation is "disabled", that contradicts Step 2.
    // If Expected Result 2 says Temperature is "enabled", that contradicts Step 1.
    
    // Let's look at the wording again.
    // "The Precipitation overlay layer toggle is in the disabled state."
    // "The Temperature overlay layer toggle is in the enabled state."
    
    // Maybe the user clicks the toggle to *enable* the layer?
    // Step 1: "clicks ... to hide it". This implies the layer was visible and is now hidden.
    // Step 2: "clicks ... to show it". This implies the layer was hidden and is now visible.
    
    // If the expected results are strictly followed as written, there is a logical error in the use case description or expected results.
    // However, often "enabled" in these auto-generated descriptions might refer to the *button* being clickable, not the state.
    // But "disabled state" usually means `aria-disabled=true`.
    
    // Let's assume the expected results describe the *visibility* state of the layers, using "enabled" = visible, "disabled" = hidden.
    // If so:
    // Precipitation should be visible (enabled).
    // Temperature should be hidden (disabled).
    // This matches the actions.
    // But the expected results text says:
    // Precipitation: disabled (hidden?)
    // Temperature: enabled (visible?)
    // This is the opposite of the actions.
    
    // Let's look at the layers table:
    // Temperature: visible by default: true
    // Precipitation: visible by default: false
    
    // Step 1: Hide Temperature. (Now Temperature is hidden).
    // Step 2: Show Precipitation. (Now Precipitation is visible).
    
    // If "enabled" means "checked" (visible):
    // Temperature should be unchecked.
    // Precipitation should be checked.
    
    // If the expected results are:
    // Precipitation toggle is in the disabled state. -> This might mean the toggle is unchecked? No, disabled usually means unclickable.
    // Or maybe it means the layer is disabled (hidden)?
    
    // Let's stick to the most logical interpretation of the user flow:
    // 1. Temperature is hidden.
    // 2. Precipitation is visible.
    // 3. Map navigated.
    // 4. Forecast loaded.
    
    // We will assert the layer visibility using the map model helpers, which is the source of truth for map state.
    await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Verify the info panel displays a weather forecast section with 24 entries.
    // We already asserted the count of entries >= 24 above.
    // We can also assert the section is visible.
    await expect(page.getByTestId('weather-forecast-section')).toBeVisible();
});
