// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import fg from "fast-glob";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, relative, resolve } from "path";
import { fileURLToPath } from "url";

// Paths
const THIS_DIR = resolve(dirname(fileURLToPath(import.meta.url)));
const APP_ROOT = resolve(THIS_DIR, "..");
const OUTPUT_DIR = resolve(THIS_DIR);
const OUTPUT_MD_PATH = resolve(OUTPUT_DIR, "generated-ui-map.md");
const SERVICES_FILE = resolve(APP_ROOT, "services.ts");

// Matches all data-testid="..." / data-testid={'...'} / data-testid={`...`} forms
const TESTID_ATTRIBUTE_RE =
    /data-testid\s*=\s*(?:"([^"]+)"|'([^']+)'|{\s*`([^`]+)`\s*}|{\s*"([^"]+)"\s*}|{\s*'([^']+)'\s*})/g;
const SCAN_IGNORE = ["**/node_modules/**", "**/dist/**", "**/generated/**", "**/*.d.ts"];

interface UiMapEntry {
    dataTestId: string;
    type: string;
    interaction: string;
    controlledBy?: string[];
    visibleByDefault?: boolean;
    dependencyTriggers?: string[];
}

interface UiMapFileEntry {
    path: string;
    entries: UiMapEntry[];
}

interface UiMapSummary {
    scannedFiles: number;
    filesWithTestIds: number;
    totalEntries: number;
    uniqueTestIds: number;
}

interface UiMap {
    sourceRoot: string;
    summary: UiMapSummary;
    files: UiMapFileEntry[];
    layers?: LayerInfo[];
}

interface LayerInfo {
    name: string;
    visibleByDefault: boolean;
    layerType: "base" | "operational";
}

function main() {
    const uiMap = buildUiMap();
    saveUiMapMarkdown(uiMap);

    console.log(`Saved UI map (${uiMap.summary.totalEntries} entries):`);
    console.log(`  MD: ${OUTPUT_MD_PATH}`);
}

// Scans all TS/TSX source files and builds the in-memory UI map
function buildUiMap(): UiMap {
    const filePaths = fg.sync(["**/*.ts", "**/*.tsx"], {
        cwd: APP_ROOT,
        absolute: true,
        onlyFiles: true,
        dot: false,
        ignore: SCAN_IGNORE
    });

    const files: UiMapFileEntry[] = [];
    let totalEntries = 0;

    for (const filePath of filePaths.sort()) {
        const entries = extractTestIdEntries(filePath);
        if (entries.length === 0) continue;

        const relativePath = toPosixPath(relative(APP_ROOT, filePath));
        files.push({ path: relativePath, entries });
        totalEntries += entries.length;
    }

    files.sort((l, r) => l.path.localeCompare(r.path, "en-US"));

    const layers = extractLayerInfo(SERVICES_FILE);

    // Count distinct test ids for the summary (a single id may appear in multiple files)
    const uniqueIds = new Set(files.flatMap((f) => f.entries.map((e) => e.dataTestId)));

    const uiMap: UiMap = {
        sourceRoot: toPosixPath(APP_ROOT),
        summary: {
            scannedFiles: filePaths.length,
            filesWithTestIds: files.length,
            totalEntries,
            uniqueTestIds: uniqueIds.size
        },
        files
    };

    if (layers.length > 0) uiMap.layers = layers;
    return uiMap;
}

// Writes the UI map as a Markdown table to OUTPUT_MD_PATH
function saveUiMapMarkdown(uiMap: UiMap) {
    const lines: string[] = [];

    lines.push("# UI Map");
    lines.push("");
    lines.push(
        `Generated from source. ` +
            `${uiMap.summary.uniqueTestIds} unique data-testid values across ` +
            `${uiMap.summary.filesWithTestIds} files.`
    );
    lines.push("");

    lines.push("## Components");
    lines.push("");
    lines.push("| data-testid | type | interaction | visible by default | activate via |");
    lines.push("|---|---|---|---|---|");

    for (const file of uiMap.files) {
        for (const entry of file.entries) {
            const visibleStr =
                entry.visibleByDefault === undefined ? "—" : String(entry.visibleByDefault);
            const triggerStr =
                entry.dependencyTriggers && entry.dependencyTriggers.length > 0
                    ? entry.dependencyTriggers.join(", ")
                    : "—";
            lines.push(
                `| ${entry.dataTestId} | ${entry.type} | ${entry.interaction} | ${visibleStr} | ${triggerStr} |`
            );
        }
    }

    lines.push("");

    if (uiMap.layers && uiMap.layers.length > 0) {
        lines.push("## Layers");
        lines.push("");
        lines.push("| name | type | visible by default |");
        lines.push("|---|---|---|");

        for (const layer of uiMap.layers) {
            lines.push(`| ${layer.name} | ${layer.layerType} | ${layer.visibleByDefault} |`);
        }

        lines.push("");
    }

    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(OUTPUT_MD_PATH, lines.join("\n") + "\n", "utf-8");
}

// Extracts all data-testid entries from a single file and infers metadata for each
function extractTestIdEntries(filePath: string): UiMapEntry[] {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split(/\r?\n/);
    const entries: UiMapEntry[] = [];
    const stateMaps = extractStateMaps(content);
    const defaultStateMap = stateMaps.defaultStateMap;
    const stateTriggerMap = extractStateTriggerMap(content, stateMaps.setterToStateMap);

    for (const match of content.matchAll(TESTID_ATTRIBUTE_RE)) {
        const value = match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5];
        if (!value) continue;

        const index = match.index ?? 0;
        const line = getLineNumber(content, index);
        const lineText = lines[line - 1] ?? "";
        const contextText = getContextWindow(lines, line);
        const type = inferElementType(lineText, contextText, value);
        const interaction = inferInteraction(type, lineText, value);
        const conditions = inferConditionsAround(lines, line, new Set(defaultStateMap.keys()));
        const effectiveConditions = filterConditionsByDefaultState(conditions, defaultStateMap);
        const visibleByDefault = inferVisibleByDefault(defaultStateMap, conditions);
        const dependencyTriggers = resolveDependencyTriggers(
            effectiveConditions,
            stateTriggerMap,
            defaultStateMap
        );

        const entry: UiMapEntry = { dataTestId: value, type, interaction };
        if (effectiveConditions.length > 0) entry.controlledBy = effectiveConditions;
        if (visibleByDefault !== undefined) entry.visibleByDefault = visibleByDefault;
        if (dependencyTriggers.length > 0) entry.dependencyTriggers = dependencyTriggers;
        entries.push(entry);
    }

    return entries;
}

function getLineNumber(content: string, index: number) {
    return content.slice(0, index).split(/\r?\n/).length;
}

function getContextWindow(lines: string[], lineNumber: number) {
    const start = Math.max(1, lineNumber - 1);
    const end = Math.min(lines.length, lineNumber + 1);
    return lines.slice(start - 1, end).join("\n");
}

// Returns boolean state variable names found in the surrounding JSX block
// that gate the rendering of this element.
// Filters candidates against knownStateVars to avoid false positives from
// generic && / ternary expressions in unrelated JS code.
function inferConditionsAround(
    lines: string[],
    lineNumber: number,
    knownStateVars: Set<string>
): string[] {
    // Look further back — some JSX blocks nest the condition many lines above the testid
    const start = Math.max(1, lineNumber - 10);
    const end = Math.min(lines.length, lineNumber + 2);
    const snippet = lines.slice(start - 1, end).join("\n");
    const conds = new Set<string>();

    // {stateVar && ( or {!stateVar && ( — JSX conditional rendering
    const andRenderRe = /\{!?([A-Za-z_][A-Za-z0-9_]*)\s*&&/g;
    // {stateVar ? ( — JSX ternary rendering
    const ternaryRenderRe = /\{!?([A-Za-z_][A-Za-z0-9_]*)\s*\?/g;
    // visible={stateVar} — explicit prop
    const propVisibleRe = /visible\s*=\s*\{\s*([A-Za-z0-9_]+)\s*\}/g;

    let m: RegExpExecArray | null;
    while ((m = andRenderRe.exec(snippet))) {
        const name = m[1];
        if (name && knownStateVars.has(name)) conds.add(name);
    }
    while ((m = ternaryRenderRe.exec(snippet))) {
        const name = m[1];
        if (name && knownStateVars.has(name)) conds.add(name);
    }
    while ((m = propVisibleRe.exec(snippet))) {
        const name = m[1];
        if (name && knownStateVars.has(name)) conds.add(name);
    }

    return [...conds];
}

function inferVisibleByDefault(
    defaultStateMap: Map<string, boolean>,
    conditions: string[]
): boolean | undefined {
    if (!conditions || conditions.length === 0) return undefined;
    // Only consider conditions whose default value is known
    const known = conditions.filter((c) => defaultStateMap.has(c));
    if (known.length === 0) return undefined;
    // For AND-chained conditions: element is visible only if all are true by default
    if (known.some((c) => defaultStateMap.get(c) === false)) return false;
    return true;
}

// Parses useState calls and const booleans to build a map of state name → default value
function extractStateMaps(content: string): {
    defaultStateMap: Map<string, boolean>;
    setterToStateMap: Map<string, string>;
} {
    const defaults = new Map<string, boolean>();
    const setterToState = new Map<string, string>();

    const useStateRegex =
        /const\s*\[\s*([A-Za-z0-9_]+)\s*,\s*([A-Za-z0-9_]+)\s*\]\s*=\s*useState(?:<[^>]+>)?\s*\(([^)]*)\)/g;
    const constBoolRegex = /const\s+([A-Za-z0-9_]+)\s*=\s*(true|false)/g;
    const paramDefaultRegex = /([A-Za-z0-9_]+)\s*=\s*(true|false)/g;

    let match: RegExpExecArray | null;
    while ((match = useStateRegex.exec(content))) {
        const stateName = match[1];
        const setterName = match[2];
        const value = match[3]?.trim();
        if (stateName && setterName) setterToState.set(setterName, stateName);
        if (!stateName || !value) continue;
        if (value === "true") defaults.set(stateName, true);
        if (value === "false") defaults.set(stateName, false);
    }

    while ((match = constBoolRegex.exec(content))) {
        const name = match[1];
        const value = match[2];
        if (!name || !value) continue;
        defaults.set(name, value === "true");
    }

    while ((match = paramDefaultRegex.exec(content))) {
        const name = match[1];
        const value = match[2];
        if (!name || !value) continue;
        if (!defaults.has(name)) defaults.set(name, value === "true");
    }

    return { defaultStateMap: defaults, setterToStateMap: setterToState };
}

// Maps each state variable to the test ids of buttons that toggle it
function extractStateTriggerMap(
    content: string,
    setterToStateMap: Map<string, string>
): Map<string, string[]> {
    const handlerToStates = new Map<string, string[]>();
    const stateToTestIds = new Map<string, string[]>();

    const functionRegex = /function\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*{([\s\S]*?)}/g;
    const arrowRegex = /const\s+([A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>\s*{([\s\S]*?)}/g;

    const registerHandler = (name: string, body: string) => {
        const states = new Set<string>();
        for (const setterName of setterToStateMap.keys()) {
            if (body.includes(`${setterName}(`)) {
                const stateName = setterToStateMap.get(setterName);
                if (stateName) states.add(stateName);
            }
        }
        if (states.size > 0) handlerToStates.set(name, [...states]);
    };

    let match: RegExpExecArray | null;
    while ((match = functionRegex.exec(content))) {
        const name = match[1];
        const body = match[2] ?? "";
        if (name) registerHandler(name, body);
    }
    while ((match = arrowRegex.exec(content))) {
        const name = match[1];
        const body = match[2] ?? "";
        if (name) registerHandler(name, body);
    }

    const clickRegex = /data-testid\s*=\s*"([^"]+)"[\s\S]{0,200}?onClick\s*=\s*{([^}]+)}/g;
    while ((match = clickRegex.exec(content))) {
        const testId = match[1];
        const handlerExpr = match[2]?.trim() ?? "";
        if (!testId || !handlerExpr) continue;

        const states = new Set<string>();
        for (const setterName of setterToStateMap.keys()) {
            if (handlerExpr.includes(`${setterName}(`)) {
                const stateName = setterToStateMap.get(setterName);
                if (stateName) states.add(stateName);
            }
        }
        if (states.size === 0) {
            const cleaned = handlerExpr.replace(/\(\)$/, "").trim();
            const handlerStates = handlerToStates.get(cleaned);
            if (handlerStates) handlerStates.forEach((s) => states.add(s));
        }
        if (states.size > 0) {
            for (const state of states) {
                const existing = stateToTestIds.get(state) ?? [];
                if (!existing.includes(testId)) existing.push(testId);
                stateToTestIds.set(state, existing);
            }
        }
    }

    return stateToTestIds;
}

function resolveDependencyTriggers(
    conditions: string[],
    stateTriggerMap: Map<string, string[]>,
    defaultStateMap: Map<string, boolean>
): string[] {
    const triggers = new Set<string>();
    for (const condition of conditions) {
        if (defaultStateMap.get(condition) === true) continue;
        const testIds = stateTriggerMap.get(condition);
        if (!testIds) continue;
        for (const testId of testIds) triggers.add(testId);
    }
    return [...triggers];
}

function inferElementType(lineText: string, contextText: string, testId: string): string {
    const combined = `${lineText}\n${contextText}`.toLowerCase();
    const tagMatch = combined.match(/<([a-z][a-z0-9]*)/i);
    const tag = tagMatch?.[1]?.toLowerCase();

    if (tag === "button" || tag === "toolbutton" || /toggle|button|close|zoom|extent/.test(testId))
        return "button";
    if (
        tag === "mapcontainer" ||
        combined.includes("map-root") ||
        combined.includes("map-container")
    )
        return "map";
    if (tag === "heading" || /heading|title/.test(testId)) return "heading";
    if (tag === "separator" || /separator/.test(testId)) return "separator";
    if (tag === "text" || /viewer|content|card|label|value/.test(testId)) return "text";
    if (
        combined.includes('role="dialog"') ||
        combined.includes("<titledsection") ||
        /panel|dialog|overlay/.test(testId)
    )
        return "panel";
    if (combined.includes('role="region"')) return "region";
    return "element";
}

function inferInteraction(type: string, lineText: string, testId: string): string {
    const combined = `${lineText} ${testId}`.toLowerCase();
    if (type === "button") return "click";
    if (type === "map") return "click / pan / zoom";
    if (type === "panel" || type === "region") return "read / assert visibility";
    if (type === "separator") return "assert visibility";
    if (type === "heading" || type === "text") return "read / assert text";
    return "read / assert";
}

// Reads services.ts and extracts layer names, types and default visibility
function extractLayerInfo(servicesFilePath: string): LayerInfo[] {
    try {
        const content = readFileSync(servicesFilePath, "utf-8");
        const layers: LayerInfo[] = [];

        for (const block of extractLayerBlocks(content)) {
            const titleMatch = block.match(/title\s*:\s*"([^"]+)"/);
            if (!titleMatch?.[1]) continue;
            const visibleMatch = block.match(/visible\s*:\s*(true|false)/);
            const visibleByDefault = visibleMatch ? visibleMatch[1] === "true" : true;
            const baseLayerMatch = block.match(/isBaseLayer\s*:\s*(true|false)/);
            const layerType = baseLayerMatch?.[1] === "true" ? "base" : "operational";
            layers.push({ name: titleMatch[1], visibleByDefault, layerType });
        }

        let baseVisibleAssigned = false;
        for (const layer of layers) {
            if (layer.layerType !== "base") continue;
            layer.visibleByDefault = !baseVisibleAssigned;
            baseVisibleAssigned = true;
        }

        return layers;
    } catch {
        return [];
    }
}

function extractLayerBlocks(content: string): string[] {
    const blocks: string[] = [];
    const startRegex = /layerFactory\.create\(\{/g;
    let match: RegExpExecArray | null;

    while ((match = startRegex.exec(content))) {
        let index = match.index + match[0].length;
        let depth = 1;
        let block = "";
        while (index < content.length && depth > 0) {
            const ch = content[index];
            if (ch === "{") depth++;
            if (ch === "}") depth--;
            if (depth > 0) block += ch;
            index++;
        }
        if (block.trim().length > 0) blocks.push(block);
        startRegex.lastIndex = index;
    }

    return blocks;
}

function filterConditionsByDefaultState(
    conditions: string[],
    defaultStateMap: Map<string, boolean>
): string[] {
    return conditions.filter((c) => defaultStateMap.get(c) !== true);
}

function toPosixPath(inputPath: string) {
    return inputPath.replace(/\\/g, "/");
}

try {
    main();
} catch (error) {
    console.error("Fatal error while building the UI map:", error);
    process.exit(1);
}
