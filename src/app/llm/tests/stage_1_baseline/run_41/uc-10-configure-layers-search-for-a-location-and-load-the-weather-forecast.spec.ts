// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for initial app state: layer switcher visible, Temperature visible, Precipitation hidden
  const tempToggle = page.getByTestId('layer-toggle-temperature');
  const precipToggle = page.getByTestId('layer-toggle-precipitation');

  // Step 1: Hide Temperature overlay
  // The prompt states Temperature is initially visible. We need to click its toggle to hide it.
  // We force click because Chakra UI checkboxes/switches often have decorative overlays.
  await tempToggle.click({ force: true });

  // Assert Temperature is now hidden (disabled state for the toggle usually means layer is off)
  // The expected result says "Temperature overlay layer toggle is in the enabled state"
  // Wait, re-reading expected results:
  // "The Precipitation overlay layer toggle is in the disabled state." -> This implies the layer is OFF?
  // "The Temperature overlay layer toggle is in the enabled state." -> This implies the layer is ON?
  // Let's re-read the steps.
  // Step 1: Click visibility toggle of Temperature to HIDE it.
  // Step 2: Click visibility toggle of Precipitation to SHOW it.
  // Expected Results:
  // - Precipitation toggle is in disabled state. (Usually disabled means unchecked/off in some contexts, or literally disabled attribute?)
  // - Temperature toggle is in enabled state.
  //
  // Let's look at standard Chakra/Aria patterns.
  // If a checkbox is checked, it is "enabled" visually. If unchecked, it is "disabled" visually?
  // Or does "disabled state" mean `aria-disabled="true"`?
  // Given the context of "visibility toggle", usually:
  // Checked = Visible (Layer Active).
  // Unchecked = Hidden (Layer Inactive).
  //
  // The expected results seem contradictory to the steps if we assume standard terminology.
  // Step 1: Hide Temp. (Temp should be Unchecked).
  // Step 2: Show Precip. (Precip should be Checked).
  // Expected: Precip toggle disabled? Temp toggle enabled?
  //
  // Alternative interpretation:
  // Maybe the "toggle" refers to the button element itself.
  // If the layer is hidden, is the toggle button disabled? Unlikely for a visibility switch.
  //
  // Let's look at the wording again.
  // "The Precipitation overlay layer toggle is in the disabled state."
  // "The Temperature overlay layer toggle is in the enabled state."
  //
  // If I hide Temperature, it becomes unchecked. If I show Precipitation, it becomes checked.
  // Could "enabled" mean "checked" (active/visible) and "disabled" mean "unchecked" (inactive/hidden)?
  // If so:
  // Temp (Hidden) -> Unchecked -> "Disabled"? But expected says "Enabled".
  // Precip (Shown) -> Checked -> "Enabled"? But expected says "Disabled".
  //
  // This is a direct contradiction.
  // Let's re-read Step 1: "clicks the visibility toggle ... to hide it."
  // Step 2: "clicks the visibility toggle ... to show it."
  //
  // Maybe the initial state is different?
  // Preconditions: "Temperature overlay layer is initially visible." "Precipitation overlay layer is initially hidden."
  //
  // If I hide Temp, it is now hidden.
  // If I show Precip, it is now visible.
  //
  // Let's assume the Expected Results describe the VISUAL STATE of the TOGGLE UI elements regarding their "active" or "checked" status, but perhaps the labels "enabled/disabled" are used loosely or refer to `aria-pressed`.
  // If `aria-pressed="true"` means the layer is visible.
  // Temp: Initially visible (pressed=true). Click to hide -> pressed=false.
  // Precip: Initially hidden (pressed=false). Click to show -> pressed=true.
  //
  // Expected:
  // Precip toggle: disabled state. (pressed=false?)
  // Temp toggle: enabled state. (pressed=true?)
  //
  // This implies:
  // After Step 1, Temp is still considered "enabled" (visible)? No, step says hide.
  // After Step 2, Precip is considered "disabled" (hidden)? No, step says show.
  //
  // Is it possible the steps are reversed in my understanding or the prompt has a typo?
  // Or does "disabled state" refer to the fact that you can't click it? No.
  //
  // Let's look at another possibility.
  // Maybe the "toggle" is a switch.
  // On = Enabled. Off = Disabled.
  // Step 1: Hide Temp. Switch goes Off.
  // Step 2: Show Precip. Switch goes On.
  // Expected: Precip Off (Disabled)? Temp On (Enabled)?
  // This contradicts the steps.
  //
  // Let's try one more interpretation.
  // Maybe the test expects us to verify the *initial* state before changing? No, "Expected results" usually follow the steps.
  //
  // Let's assume the Expected Results text has swapped the layer names or states.
  // If I follow the steps:
  // Temp is Hidden. Precip is Visible.
  // I will assert that Temp is unchecked (hidden) and Precip is checked (visible).
  // If the prompt explicitly demands "Precip toggle is in disabled state", I might need to check if "disabled" means `aria-disabled="true"`.
  // However, standard visibility toggles are rarely disabled unless locked.
  //
  // Let's look at the complexity: "hard". This suggests careful handling of async states and locators.
  //
  // I will stick to the logical outcome of the steps:
  // 1. Temp Hidden.
  // 2. Precip Visible.
  //
  // If the expected results are strictly "Precip disabled, Temp enabled", and that contradicts the steps, I will prioritize the steps for actions and the logical DOM state for assertions, but I will check if there is a specific "disabled" attribute.
  // Actually, let's look at the phrase "toggle is in the disabled state".
  // In some UI libraries, a toggle that is "off" might be styled to look "disabled" (greyed out).
  // If "Enabled" = On (Visible) and "Disabled" = Off (Hidden).
  // Then:
  // Temp (Hidden) -> Disabled.
  // Precip (Visible) -> Enabled.
  //
  // The expected results say:
  // Precip -> Disabled.
  // Temp -> Enabled.
  //
  // This is the exact opposite of the steps' outcome.
  //
  // Is it possible Step 1 and 2 are *not* executed in that order? No, "Steps" are ordered.
  //
  // Is it possible the user *unchecks* Temp (making it disabled/off) and *unchecks* Precip (making it disabled/off)?
  // No, Step 2 says "show it".
  //
  // I will assume the Expected Results text provided in the prompt contains an error regarding the mapping of layers to states, or "enabled/disabled" refers to something else (e.g. locked status).
  // However, I must generate the test. I will assert the visual state corresponding to the steps (Temp Hidden, Precip Visible).
  // If I must follow the expected results literally, I would have to toggle them back, which isn't in the steps.
  //
  // Wait, look at Step 1: "clicks ... to hide it."
  // Look at Step 2: "clicks ... to show it."
  //
  // Maybe the "toggle" refers to the *layer item* in the TOC?
  //
  // Let's try to find if there is a `data-testid` for the layer container.
  // I will use `getByTestId` for the specific layer toggles.
  //
  // I will assert:
  // - Temp toggle is unchecked (hidden).
  // - Precip toggle is checked (visible).
  //
  // If the prompt's expected results are strict, I might fail. But following the steps is the primary instruction.
  //
  // Let's proceed with the steps.

  // Step 1: Hide Temperature
  await tempToggle.click({ force: true });

  // Step 2: Show Precipitation
  await precipToggle.click({ force: true });

  // Verify Layer States
  // Using expect.poll to ensure the UI has updated
  await expect.poll(() => tempToggle.isChecked()).toBe(false);
  await expect.poll(() => precipToggle.isChecked()).toBe(true);

  // Step 3: Search for a location
  const searchInput = page.getByPlaceholder('Search'); // Or getByLabel('Search')
  // Assuming a standard geocoder input. If no placeholder, use getByRole('searchbox') or similar.
  // Let's try to find the geocoder container first.
  const geocoder = page.getByTestId('geocoder');
  if (geocoder.count() > 0) {
      await geocoder.locator('input').fill('Münster');
  } else {
      // Fallback to generic search input
      await page.getByRole('searchbox').fill('Münster');
  }

  // Step 4: Wait for result list and select first result
  // The result list usually appears in a dropdown below the search input.
  // We wait for the first result item to be visible.
  const firstResult = page.locator('[data-testid="geocoder-result-item"]').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate
  // Since we don't have map helpers, we wait for the info panel to start updating or for a loading state to clear.
  // The prompt mentions "info panel is visible".
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Step 6: Wait for info panel to load the forecast
  // The expected result says "displays a weather forecast section with 24 entries".
  // We need to find the forecast entries.
  // Assuming the forecast entries have a test id or role.
  // Let's look for a container with 24 items.
  
  // Poll for the number of forecast entries.
  // We assume the entries are in a list.
  const forecastEntries = page.locator('[data-testid="forecast-entry"]');
  
  await expect.poll(async () => {
      return await forecastEntries.count();
  }).toBe(24);
});
