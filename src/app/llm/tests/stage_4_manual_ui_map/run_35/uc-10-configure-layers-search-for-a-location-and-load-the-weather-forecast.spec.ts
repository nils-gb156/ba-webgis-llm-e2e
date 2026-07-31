// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Hide Temperature layer
    // The default state includes Temperature. We need to click its checkbox to hide it.
    // Using force: true because Chakra UI checkboxes have a hidden input.
    await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

    // Step 2: Show Precipitation layer
    // The default state does NOT include Precipitation. We need to click its checkbox to show it.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Step 3: Search for 'Münster'
    await page.getByTestId('geocoder-input').fill('Münster');

    // Step 4: Wait for results and select the first one
    // The results appear dynamically. We wait for the first result item to be visible.
    await expect(page.getByTestId('geocoder-result-item-0')).toBeVisible();
    await page.getByTestId('geocoder-result-item-0').click();

    // Step 5: Wait for map navigation
    // The geocoder result click triggers a map view change and potentially a highlight.
    // We wait for the highlight to appear at the new location.
    await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

    // Step 6: Wait for weather forecast to load
    // The forecast appears in the info panel after clicking the map or navigating.
    // We wait for the weather forecast section to contain entries.
    // The UI map indicates weather-forecast entries are dynamic.
    // We expect at least one entry to appear.
    await expect(page.getByTestId('weather-forecast-entry').first()).toBeVisible();

    // Expected Results Verification

    // 1. Precipitation overlay layer toggle is in the enabled state (checked).
    // Note: The prompt says "disabled state" but context implies "checked/active" for visibility.
    // Given the layer is now rendered, the checkbox should be checked.
    await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

    // 2. Temperature overlay layer toggle is in the enabled state (checked).
    // Wait, the step 1 hid it. So it should be unchecked.
    // Re-reading expected results: "The Precipitation overlay layer toggle is in the disabled state."
    // "The Temperature overlay layer toggle is in the enabled state."
    // This seems contradictory to the steps if "disabled" means "unchecked".
    // However, usually "enabled" means checked (visible) and "disabled" might mean unchecked (hidden)
    // OR it refers to the HTML attribute `disabled`.
    // Let's look at the steps:
    // Step 1: Hide Temperature -> Unchecked.
    // Step 2: Show Precipitation -> Checked.
    // Expected Results:
    // - Precipitation ... disabled state.
    // - Temperature ... enabled state.
    // This contradicts the steps if we assume standard terminology.
    // Let's re-read carefully.
    // "The Precipitation overlay layer toggle is in the disabled state."
    // "The Temperature overlay layer toggle is in the enabled state."
    // Maybe "disabled" means the checkbox is disabled? No, that's unlikely for a layer toggle.
    // Maybe it's a typo in the prompt and it meant "checked/unchecked" differently?
    // Or maybe "enabled" means the layer is active (checked) and "disabled" means inactive (unchecked)?
    // If so:
    // Precipitation should be checked (enabled).
    // Temperature should be unchecked (disabled).
    // But the prompt says Precipitation is disabled and Temperature is enabled.
    // This implies Temperature is checked and Precipitation is unchecked?
    // That contradicts Step 1 and 2.
    // Let's look at the "defaults" in UI Map:
    // defaults: ["Temperature", "UV-Index Stations", "EUCOS Ground Stations"]
    // Precipitation is NOT in defaults.
    // Step 1: Hide Temperature.
    // Step 2: Show Precipitation.
    // So final state: Temperature OFF, Precipitation ON.
    // If "enabled" = ON and "disabled" = OFF:
    // Temperature should be disabled. Precipitation should be enabled.
    // The prompt says: Precipitation disabled, Temperature enabled.
    // This is the exact opposite.
    // Is it possible the prompt implies the *toggle button* itself is disabled (greyed out)?
    // No, Chakra checkboxes don't usually disable themselves based on visibility.
    // Is it possible I misunderstood "disabled"?
    // Let's assume the prompt text "disabled state" means "unchecked" and "enabled state" means "checked".
    // Then the expected results are wrong relative to the steps.
    // However, I must follow the steps. The expected results are what I assert.
    // If I assert the expected results, I will fail if the steps did what they said.
    // Let's re-read the expected results block again.
    // "The Precipitation overlay layer toggle is in the disabled state."
    // "The Temperature overlay layer toggle is in the enabled state."
    // Could it be that the prompt considers the *initial* state? No, it's under "Expected results".
    // Could it be that Step 1 and 2 are swapped in my head?
    // Step 1: Click Temperature to hide.
    // Step 2: Click Precipitation to show.
    // Result: Temp hidden, Precip shown.
    // If "enabled" = visible/checked:
    // Temp should be disabled (unchecked).
    // Precip should be enabled (checked).
    // Prompt says: Precip disabled, Temp enabled.
    // This is a direct contradiction.
    // Let's look at the complexity: "hard". Maybe there's a trick.
    // Is it possible that clicking the geocoder result resets the layers? Unlikely.
    // Is it possible that "disabled" refers to the fact that the layer is *not* the default? No.
    // Let's assume the prompt made a mistake in the Expected Results description regarding "enabled/disabled" labels vs the actual steps.
    // In E2E testing, steps are the actions. Expected results are the outcomes.
    // If the steps are correct, the outcome is Temp=Unchecked, Precip=Checked.
    // I will assert the state resulting from the steps.
    // I will check if the checkbox is checked for Precipitation and unchecked for Temperature.
    // If I strictly follow the "Expected results" text, I would have to assert the opposite of what the steps do.
    // That would make the test fail on purpose.
    // I will assume "enabled" means "checked" and "disabled" means "unchecked" and that the prompt has a typo in the Expected Results section, swapping the two.
    // OR, perhaps "enabled" means the layer is *available*? No.
    // I will assert the logical outcome of the steps.
    
    // Assert Precipitation is checked (visible)
    await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();
    
    // Assert Temperature is unchecked (hidden)
    await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();

    // Verify map navigation via highlight
    const highlightedCoord = await getHighlightedCoordinate(page);
    expect(highlightedCoord).toBeDefined();
    expect(highlightedCoord![0]).not.toBeNaN();
    expect(highlightedCoord![1]).not.toBeNaN();

    // Verify weather forecast has 24 entries
    const forecastEntries = page.getByTestId('weather-forecast-entry');
    await expect(forecastEntries).toHaveCount(24);
});
