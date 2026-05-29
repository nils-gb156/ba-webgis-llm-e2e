// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Text } from "@chakra-ui/react";
import { UVI_ATTRIBUTE_LABELS, UVI_ATTRIBUTE_ORDER } from "./uviAttributes";

export type UviFeatureInfo =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "empty" }
    | { status: "error"; message: string }
    | { status: "text"; content: string }
    | { status: "json"; features: { id?: string; properties: Record<string, unknown> }[] };

export interface UviStationInfoProps {
    uviFeatureInfo?: UviFeatureInfo;
}

function formatValue(value: unknown): string {
    if (value == null) {
        return "-";
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

export function UviStationInfo({ uviFeatureInfo }: UviStationInfoProps) {
    if (!uviFeatureInfo || uviFeatureInfo.status === "idle") {
        return (
            <Text fontSize="sm" color="gray.600">
                Click on a UVI station to load station info.
            </Text>
        );
    }

    if (uviFeatureInfo.status === "loading") {
        return (
            <Text fontSize="sm" color="gray.600">
                Loading station info...
            </Text>
        );
    }

    if (uviFeatureInfo.status === "error") {
        return (
            <Text fontSize="sm" color="red.600">
                {uviFeatureInfo.message}
            </Text>
        );
    }

    if (uviFeatureInfo.status === "empty") {
        return (
            <Text fontSize="sm" color="gray.600">
                No station at this location.
            </Text>
        );
    }

    if (uviFeatureInfo.status === "text") {
        return (
            <Text fontSize="sm" whiteSpace="pre-wrap">
                {uviFeatureInfo.content}
            </Text>
        );
    }

    return (
        <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            p={2}
            maxHeight="260px"
            overflowY="auto"
        >
            {uviFeatureInfo.features.map((feature, featureIndex) => (
                <Box
                    key={feature.id ?? featureIndex}
                    mb={featureIndex < uviFeatureInfo.features.length - 1 ? 3 : 0}
                >
                    {Object.entries(feature.properties).length ? (
                        UVI_ATTRIBUTE_ORDER.filter((key) => key in feature.properties).map(
                            (key) => (
                                <Text key={key} fontSize="sm">
                                    <Text as="span" fontWeight="semibold">
                                        {UVI_ATTRIBUTE_LABELS[key] ?? key}:
                                    </Text>{" "}
                                    {formatValue(feature.properties[key])}
                                </Text>
                            )
                        )
                    ) : (
                        <Text fontSize="sm" color="gray.600">
                            No attribute data available.
                        </Text>
                    )}
                </Box>
            ))}
        </Box>
    );
}
