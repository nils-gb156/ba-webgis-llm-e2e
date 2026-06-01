// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createCustomElement } from "@open-pioneer/runtime";
import * as appMetadata from "open-pioneer:app";
import { AppUI } from "./AppUI";

// Entry point: wrap the React app in a <webgis-app> web component so it can be
// embedded into any HTML page as a custom element.
const Element = createCustomElement({
    component: AppUI,
    appMetadata
});

customElements.define("webgis-app", Element);
