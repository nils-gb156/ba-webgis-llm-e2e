// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Separator, Text } from "@chakra-ui/react";
import { EUCOS_ATTRIBUTE_LABELS, EUCOS_ATTRIBUTE_ORDER } from "./eucosAttributes";

export type EucosFeatureInfo =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "empty" }
    | { status: "error"; message: string }
    | { status: "text"; content: string }
    | { status: "json"; features: { id?: string; properties: Record<string, unknown> }[] };

export interface EucosStationInfoProps {
    eucosFeatureInfo?: EucosFeatureInfo;
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

export function EucosStationInfo({ eucosFeatureInfo }: EucosStationInfoProps) {
    if (!eucosFeatureInfo || eucosFeatureInfo.status === "idle") {
        return (
            <Text fontSize="sm" color="gray.600">
                Click on a EUCOS station to load station info.
            </Text>
        );
    }

    if (eucosFeatureInfo.status === "loading") {
        return (
            <Text fontSize="sm" color="gray.600">
                Loading station info...
            </Text>
        );
    }

    if (eucosFeatureInfo.status === "error") {
        return (
            <Text fontSize="sm" color="red.600">
                {eucosFeatureInfo.message}
            </Text>
        );
    }

    if (eucosFeatureInfo.status === "empty") {
        return (
            <Text fontSize="sm" color="gray.600">
                No station at this location.
            </Text>
        );
    }

    if (eucosFeatureInfo.status === "text") {
        return (
            <Text fontSize="sm" whiteSpace="pre-wrap">
                {eucosFeatureInfo.content}
            </Text>
        );
    }

    return (
        <Box
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            p={2}
            maxHeight="200px"
            overflowY="auto"
        >
            {eucosFeatureInfo.features.map((feature, featureIndex) => (
                <Box key={feature.id ?? featureIndex}>
                    {Object.entries(feature.properties).length ? (
                        EUCOS_ATTRIBUTE_ORDER.filter((key) => key in feature.properties).map(
                            (key) => (
                                <Text key={key} fontSize="sm">
                                    <Text as="span" fontWeight="semibold">
                                        {EUCOS_ATTRIBUTE_LABELS[key] ?? key}:
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
                    {featureIndex < eucosFeatureInfo.features.length - 1 && <Separator my={2} />}
                </Box>
            ))}
        </Box>
    );
}
