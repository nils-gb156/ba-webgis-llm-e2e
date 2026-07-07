# UI Map

Generated from source. 39 unique data-testid values across 13 files.

## Components

| data-testid                   | type    | interaction              | visible by default | activate via       |
| ----------------------------- | ------- | ------------------------ | ------------------ | ------------------ |
| footer                        | element | read / assert            | —                  | —                  |
| coordinate-viewer             | text    | read / assert text       | —                  | —                  |
| scale-bar                     | element | read / assert            | —                  | —                  |
| scale-viewer                  | text    | read / assert text       | —                  | —                  |
| geocoder-input                | element | read / assert            | —                  | —                  |
| geocoder-clear-button         | button  | click                    | —                  | —                  |
| geocoder-results              | element | read / assert            | false              | —                  |
| geocoder-result-item-${index} | element | read / assert            | false              | —                  |
| weather-forecast-section      | element | read / assert            | —                  | —                  |
| uvi-station-section           | element | read / assert            | —                  | —                  |
| eucos-station-section         | element | read / assert            | —                  | —                  |
| map-container                 | map     | click / pan / zoom       | —                  | —                  |
| map-controls-panel            | panel   | read / assert visibility | —                  | —                  |
| layer-switcher                | panel   | read / assert visibility | true               | —                  |
| legend                        | element | read / assert            | true               | —                  |
| map-toolbar                   | element | read / assert            | —                  | —                  |
| initial-extent-button         | button  | click                    | —                  | —                  |
| zoom-in-button                | button  | click                    | —                  | —                  |
| zoom-out-button               | button  | click                    | —                  | —                  |
| measurement-toggle            | button  | click                    | —                  | —                  |
| print-toggle                  | button  | click                    | —                  | —                  |
| layer-switcher-toggle         | button  | click                    | —                  | —                  |
| legend-toggle                 | button  | click                    | —                  | —                  |
| info-panel-toggle             | button  | click                    | —                  | —                  |
| info-panel                    | panel   | read / assert visibility | true               | —                  |
| geocoder-panel                | panel   | read / assert visibility | —                  | —                  |
| printing-panel                | panel   | read / assert visibility | false              | print-toggle       |
| printing                      | element | read / assert            | —                  | —                  |
| measurement-panel             | panel   | read / assert visibility | false              | measurement-toggle |
| measurement                   | element | read / assert            | —                  | —                  |
| weather-forecast              | element | read / assert            | —                  | —                  |
| weather-forecast-entry        | element | read / assert            | —                  | —                  |
| ...                           | element | read / assert            | —                  | —                  |
| ...                           | element | read / assert            | —                  | —                  |
| ...                           | element | read / assert            | —                  | —                  |
| weather-forecast              | element | read / assert            | —                  | —                  |
| clouds-legend                 | element | read / assert            | —                  | —                  |
| eucos-stations-legend         | element | read / assert            | —                  | —                  |
| precipitation-legend          | element | read / assert            | —                  | —                  |
| temperature-legend            | element | read / assert            | —                  | —                  |
| uv-index-legend               | element | read / assert            | —                  | —                  |
| uvi-stations-legend           | element | read / assert            | —                  | —                  |

## Layers

| name                  | type        | visible by default |
| --------------------- | ----------- | ------------------ |
| Carto Light           | base        | true               |
| Carto Dark            | base        | false              |
| OpenStreetMap         | base        | false              |
| UV-Index              | operational | false              |
| Temperature           | operational | true               |
| Precipitation         | operational | false              |
| Clouds                | operational | false              |
| UV-Index Stations     | operational | true               |
| EUCOS Ground Stations | operational | true               |
