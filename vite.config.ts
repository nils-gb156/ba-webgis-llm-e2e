// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/// <reference types="vitest" />
import { pioneer } from "@open-pioneer/vite-plugin-pioneer";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";

// @ts-expect-error Invalid typings
import eslint from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const devMode = mode === "development";

    // Allowed values are "DEBUG", "INFO", "WARN", "ERROR"
    const logLevel = devMode ? "INFO" : "WARN";

    return {
        root: resolve(__dirname, "src"),
        publicDir: resolve(__dirname, "public"),

        // Load .env files from this directory instead of `root`.
        envDir: __dirname,

        // Base public path. Must match the GitHub Pages project path
        // (https://<user>.github.io/ba-webgis-llm-e2e/) so that asset URLs resolve correctly.
        base: "/ba-webgis-llm-e2e/",

        // Vite's build output is written to dist/www
        build: {
            outDir: resolve(__dirname, "dist/www"),
            emptyOutDir: true,

            // Minimum browser versions supported by generated JS/CSS
            // See also:
            // - https://vitejs.dev/config/build-options.html#build-target
            target: "baseline-widely-available"
        },

        optimizeDeps: {
            // Include services.{js/ts} files as entry points.
            // This makes it easier for vite's dev server to find dependencies,
            // and thereby reduces the number of repeated bundler executions on dev server startup.
            // Adapt the file patterns if your service modules used a different naming scheme.
            entries: ["**/*.html", "**/services.{ts,js}", "!**/dist/**"]
        },
        plugins: [
            pioneer({
                // Whether to include src/index.html in the built output
                rootSite: true,

                // Additional directories to include as html (must contain index.html files)
                sites: ["sites"],

                // Apps to distribute as .js files for embedded use cases
                apps: []
            }),
            react(),
            eslint()
        ],

        // Ignore irrelevant deprecations.
        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: ["import"]
                }
            }
        },

        // define global constants
        // See also: https://vitejs.dev/config/shared-options.html#define
        define: {
            __LOG_LEVEL__: JSON.stringify(logLevel)
        },

        // https://vitest.dev/config/
        test: {
            globals: true,
            environment: "happy-dom",
            setupFiles: ["testing/global-setup.ts"],

            // Generated Playwright tests live here; they must not be run by vitest.
            exclude: [...configDefaults.exclude, "**/app/llm/tests/**"],

            server: {
                deps: {
                    // Workaround to fix some import issues, see
                    // https://github.com/open-pioneer/trails-openlayers-base-packages/issues/314
                    inline: [/@open-pioneer[/\\]/]
                }
            }
        },

        // prettier-ignore
        server: {
            // Use this option if your development setup uses hostnames other than localhost.
            // See also https://vite.dev/config/server-options.html#server-allowedhosts
            // allowedHosts: [".example.com"],

            // disable hot reloading
            // in dev mode press "r" to trigger reload and make changes active
            // See also: https://vitejs.dev/config/server-options.html#server-hmr
            // hmr: false

            proxy: {
                // Proxy DWD WMS GetFeatureInfo requests to avoid CORS (server sends no Access-Control-Allow-Origin)
                "/dwd-wms": {
                    target: "https://maps.dwd.de",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/dwd-wms/, "/geoserver/dwd/wms")
                }
            }
        }
    };
});
