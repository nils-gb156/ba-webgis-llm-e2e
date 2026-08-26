// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";
import { isLayerRendered } from "../../llm/map-model-helpers";

const PRECIPITATION_LAYER_TITLE = "Precipitation";

test("UC-5: activate the Precipitation overlay and verify the legend updates", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    const map = page.getByTestId("map-container");
    const layerSwitcher = page.getByTestId("layer-switcher");
    const legend = page.getByTestId("legend");
    // The TOC renders each layer with a checkbox whose accessible name is the
    // layer title.
    const precipitationToggle = layerSwitcher.getByRole("checkbox", {
        name: PRECIPITATION_LAYER_TITLE,
        exact: true
    });
    const precipitationLabel = layerSwitcher.getByText(PRECIPITATION_LAYER_TITLE, { exact: true });
    // The Precipitation legend entry is only rendered while the layer is visible.
    const precipitationLegendEntry = legend.getByTestId("precipitation-legend");

    // Precondition: the app is loaded and the map is rendered.
    await expect(map).toBeVisible();

    // Precondition: wait until the OpenLayers map model is available on globalThis
    // (exposed by MapComponent for E2E inspection) so the app is fully initialized.
    await page.waitForFunction(
        () => (globalThis as { __openPioneerMap?: unknown }).__openPioneerMap != null
    );

    // Precondition: the layer switcher (TOC) and legend are visible.
    await expect(layerSwitcher).toBeVisible();
    await expect(legend).toBeVisible();

    // Precondition: the Precipitation overlay layer is initially hidden. Verified
    // on the toggle (unchecked), the map model (layer not rendered) and the legend
    // (no Precipitation entry).
    await expect(precipitationToggle).not.toBeChecked();
    expect(await isLayerRendered(page, PRECIPITATION_LAYER_TITLE)).toBe(false);
    await expect(precipitationLegendEntry).toHaveCount(0);

    // Step 1: click the visibility toggle of the Precipitation overlay layer to show it.
    // Click the label since the underlying checkbox input is visually covered by
    // the Chakra control element (which would intercept pointer events).
    await precipitationLabel.click();

    // Step 2: the user views the legend (assertions below).

    // Expected result: the Precipitation overlay layer toggle is in the enabled
    // (checked) state.
    await expect(precipitationToggle).toBeChecked();

    // Expected result: the legend displays an entry corresponding to the
    // Precipitation layer.
    await expect(precipitationLegendEntry).toBeVisible();
    await expect(precipitationLegendEntry).toContainText(PRECIPITATION_LAYER_TITLE);
});
