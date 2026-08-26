// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "@playwright/test";

test("UC-8: measure a distance by drawing a line on the map", async ({ page }) => {
    await page.goto("http://localhost:5173/ba-webgis-llm-e2e/");

    // Wait for the app to fully initialize (tiles, services, etc.).
    await page.waitForLoadState("networkidle");

    const map = page.getByTestId("map-container");
    const measurementToggle = page.getByTestId("measurement-toggle");
    const measurementPanel = page.getByTestId("measurement-panel");

    // Precondition: the app is loaded and the map is rendered.
    await expect(map).toBeVisible();

    // Precondition: the measurement toggle is visible and the measurement panel
    // is not yet open.
    await expect(measurementToggle).toBeVisible();
    await expect(measurementPanel).toHaveCount(0);

    // Step 1: open the measurement panel by clicking the toolbar toggle.
    await measurementToggle.click();

    // Expected result: the measurement panel and its content are visible.
    await expect(measurementPanel).toBeVisible();
    await expect(page.getByTestId("measurement")).toBeVisible();

    // Step 2: draw a measurement line on the map (click, click, double-click to finish).
    await map.click({ position: { x: 500, y: 250 } });
    await map.click({ position: { x: 650, y: 300 } });
    await map.dblclick({ position: { x: 750, y: 350 } });

    // Expected result: the measurement panel remains visible after drawing.
    await expect(measurementPanel).toBeVisible();

    // Expected result: the MeasurementController attaches a finished-measurement
    await expect(map.getByText(/\b\d+(\.\d+)?\s?(km|m)\b/i)).toBeVisible({ timeout: 5000 });
});
