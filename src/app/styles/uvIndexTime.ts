// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/**
 * Builds the WMS time dimension extent for the DWD UV-Index layer dynamically.
 *
 * The extent spans from the start of the current day (UTC) to two days ahead
 * with a daily interval (P1D), so the demo always requests an up-to-date,
 * valid time range instead of a fixed (and eventually stale) date.
 */
export function buildUvIndexTimeExtent(daysAhead = 2): string {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + daysAhead);

    return `${start.toISOString()}/${end.toISOString()}/P1D`;
}
