// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Notifier } from "@open-pioneer/notifier";
import { MapComponent } from "./components/MapComponent";
import { Footer } from "./components/Footer";

export function AppUI() {
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%" }}>
            <Notifier />
            <MapComponent></MapComponent>
            <Footer />
        </div>
    );
}
