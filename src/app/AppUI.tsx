// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapComponent } from "./components/MapComponent";

export function AppUI() {
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%" }}>
            <MapComponent></MapComponent>
        </div>
    );
}
