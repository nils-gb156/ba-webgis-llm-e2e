// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box } from "@chakra-ui/react";
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";
import { WeatherForecast } from "./WeatherForecast";

export interface InfoPanelProps {
    coordinate?: [number, number];
}

export function InfoPanel({ coordinate }: InfoPanelProps) {
    return (
        <TitledSection
            title={
                <SectionHeading size="md" data-testid="toc-heading">
                    Information
                </SectionHeading>
            }
        >
            <SectionHeading size="sm" data-testid="toc-heading">
                Weather Forecast
            </SectionHeading>
            <Box mt={2} data-testid="info-panel-content">
                {coordinate ? (
                    <WeatherForecast coordinate={coordinate} />
                ) : (
                    <p data-testid="info-panel-empty">Click on the map to load a forecast.</p>
                )}
            </Box>
        </TitledSection>
    );
}
