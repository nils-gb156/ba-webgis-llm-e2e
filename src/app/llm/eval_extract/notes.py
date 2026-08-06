"""Stichpunkte zu Auffaelligkeiten und getrennt gekennzeichnete Hypothesen.

Die Stichpunkte enthalten nur Zahlen, die in derselben Berichtsdatei in einer
Tabelle stehen (oder in der genannten Nachbardatei). Sie werden von den
report_*.py-Skripten an das Ende der jeweiligen Datei angehaengt, damit die
Berichte reproduzierbar bleiben.

HYPOTHESEN sind ausdruecklich unbelegt und stehen in einem eigenen Abschnitt.
"""

AUFFAELLIG = {
    1: [
        "INFRA_FAIL ist mit 345 von 500 Dateien (69,0 %) die dominierende "
        "Kategorie; PASS erreichen 100 Dateien (20,0 %).",
        "Fünf der zehn Use Cases erreichen in keinem der 50 Läufe PASS "
        "(uc-02, uc-06, uc-07, uc-08, uc-10); kein Use Case erreicht in allen "
        "Läufen PASS.",
        "Die beiden häufigsten Fehlersignaturen (`element(s) not found` bei "
        "`getByTestId` mit 69 Fällen und `strict mode violation` bei "
        "`locator('canvas')` mit 68 Fällen) machen zusammen 34,2 % aller "
        "Fehlschläge aus.",
        "`selector_score` hat den Median 2; 288 der 492 bewerteten Dateien "
        "erhalten genau 2. `map_interaction_score` hat den Median 1 und in "
        "keiner einzigen Datei den Wert 4.",
        "Bei uc-03 liegt der `assertion_score` in 35 von 47 bewerteten Dateien "
        "auf 1 - bei gleichzeitig 62 % PASS-Rate. Daraus kommen 31 der 33 "
        "`vacuous_pass` dieser Stufe.",
        "Alle 73 Laufzeit-Ausreißer liegen bei `duration_s` ≥ 30,00 s, also am "
        "Playwright-Testtimeout; 10 Zeilen haben `duration_s` = 0,00 s "
        "(GENERATION_ERROR, nie ausgeführt).",
        "197 der 500 Dateien (39,4 %) verwenden mindestens eine testid, die im "
        "Anwendungsquellcode nicht existiert; insgesamt 106 verschiedene "
        "erfundene Werte (siehe codemuster.md).",
        "Die Begründungstexte des Judge sind weitgehend Vorlagen: bei "
        "`map_interaction` deckten 16 verschiedene Texte alle 500 Dateien ab.",
    ],
    2: [
        "Gegenüber Stufe 1 verschiebt sich das Fehlerbild von INFRA_FAIL "
        "(345 → 211) zu ASSERTION_FAIL (43 → 166); die PASS-Rate steigt nur "
        "von 20,0 % auf 22,0 %.",
        "Drei Use Cases erreichen nie PASS (uc-06, uc-08, uc-10), sieben "
        "springen zwischen PASS und Fehlschlag.",
        "Ein Lauf (`run_06`) hat PASS-Rate 0 %, der beste Lauf 40 %; die "
        "Streuung über die Läufe ist mit 8,81 Prozentpunkten die zweitgrößte "
        "aller Stufen.",
        "Häufigste Fehlersignatur ist der Klick-Timeout "
        "(`locator.click: Test timeout of 30000ms exceeded`) mit 77 von 390 "
        "Fehlschlägen (19,7 %).",
        "27 Fehlschläge tragen `toHaveValue ... Error: Not an input element` - "
        "der Accessibility-Snapshot weist das Basemap-Widget als `combobox` "
        "aus, das reale Element ist kein `<input>`.",
        "Nur 2 von 500 Dateien verwenden eine nicht existierende testid "
        "(gegenüber 197 in Stufe 1); die Kontextdatei listet 24 der 39 real "
        "existierenden testids.",
        "Zwei Zeilen haben `duration_s` über dem Testtimeout (124,38 s und "
        "119,81 s); beide sind Umgebungsfehler "
        "(`browserContext.newPage` bzw. `while setting up \"page\"`).",
        "`map_interaction_score` bleibt mit Median 2 niedrig und erreicht in "
        "keiner Datei 4, obwohl die Helferdatei in dieser Stufe nicht im "
        "Kontext liegt.",
    ],
    3: [
        "Erste Stufe mit einem Use Case bei 100 % PASS (uc-01) und "
        "gleichzeitig einem bei 0 % (uc-02).",
        "`map_interaction_score` springt auf Median 3 (Mittelwert 2,85) und "
        "erreicht erstmals den Wert 4 (66 Dateien); `selector_score` steigt auf "
        "Median 4.",
        "Bei uc-02 sind 47 der 49 Läufe INFRA_FAIL; die häufigste Signatur "
        "(21 Fälle) ist `expect.poll() does not support \"resolves\" matcher` - "
        "eine unzulässige Matcher-Kombination, kein Selektorproblem.",
        "uc-03 fällt auf 4 % PASS: alle 48 Fehlschläge sind ASSERTION_FAIL, "
        "davon 46 mit `Matcher error: ... must be a number or bigint`.",
        "Alle drei COMPILE_ERROR-Zeilen sind Syntaxdefekte im generierten Code "
        "(fehlendes `//`, Leerzeichen im Identifier `__open pioneerMap`) und "
        "keine Importfehler.",
        "416 der 499 Dateien (83,4 %) importieren die Helferdatei, alle mit dem "
        "identischen Pfad `../../../map-model-helpers`; kein abweichender Pfad.",
        "`run_20/uc-02` fehlt vollständig (keine Testdatei, keine CSV-Zeile, "
        "keine Judge-Bewertung).",
    ],
    4: [
        "Höchste PASS-Rate der Stufen 1-4 (38,6 %); erstmals erreicht jeder "
        "Use Case mindestens einmal PASS und keiner immer.",
        "Die Scores sind in allen vier Dimensionen die höchsten der Stufen 1-4 "
        "(coverage Ø 3,91, selector Ø 3,41, map_interaction Ø 3,01, "
        "assertion Ø 3,59).",
        "uc-04 fällt trotz besserem Kontext auf 12 % PASS: 34 der 44 "
        "Fehlschläge (77,3 %) sind `strict mode violation` bei "
        "`getByRole('checkbox', { name: 'UV-Index' })` - der Name trifft auch "
        "`UV-Index Stations`.",
        "Alle vier COMPILE_ERROR-Zeilen liegen in uc-06 und haben dieselbe "
        "Ursache: der Importpfad `../../map-model-helpers` statt "
        "`../../../map-model-helpers` (4 von 370 Dateien mit Helfer-Import).",
        "uc-03 bleibt bei 14 % PASS; alle 43 Fehlschläge sind ASSERTION_FAIL "
        "und alle 43 tragen `Matcher error` beim Vergleich der Zoomstufe.",
        "12 der 15 `vacuous_pass` liegen in uc-08 - dort haben alle 12 "
        "PASS-Fälle einen `assertion_score` ≤ 2.",
        "Die Zahl der Fehlersignaturgruppen sinkt auf 69 (Stufe 1: 99); die "
        "Fehlerbilder konzentrieren sich.",
    ],
    5: [
        "Höchste PASS-Rate aller Stufen (73,2 %); INFRA_FAIL fällt auf 15 von "
        "500 Dateien (3,0 %), COMPILE_ERROR auf 0.",
        "Vier Use Cases erreichen in allen 50 Läufen PASS (uc-01, uc-02, "
        "uc-04, uc-05); kein Use Case bleibt bei 0 %.",
        "146 Läufe (29,2 %) bestehen in Iteration 1, 136 Läufe erreichen "
        "10 Iterationen - davon bestehen nur 2. Nach Iteration 2 sind 54,8 % "
        "aller Läufe erledigt.",
        "72,4 % der 1654 Iterationsübergänge behalten die Fehlerklasse des "
        "Vorgängers. Aus ASSERTION_FAIL führen nur 9,2 % der Übergänge zu "
        "PASS, aus INFRA_FAIL 22,9 %.",
        "87 Übergänge (5,3 %) sind Rückschritte, alle von ASSERTION_FAIL zu "
        "INFRA_FAIL (85) oder COMPILE_ERROR (2).",
        "119 der 134 abgebrochenen Läufe enden in ASSERTION_FAIL; die drei "
        "größten Blöcke sind uc-03 (41 Abbrüche), uc-08 (36) und uc-07 (27).",
        "491 der 1654 Iterationspaare (29,7 %) enthalten nach Entfernen von "
        "Kommentaren und Leerraum identischen Code; der Medianwert der "
        "Ähnlichkeit steigt von 0,910 (Iteration 0 → 1) auf 0,995 "
        "(Iteration 8 → 9).",
        "In 96 der 354 Läufe mit mehreren Iterationen (27,1 %) enthält die "
        "letzte Iteration weniger `expect(`-Aufrufe als die erste; bei den "
        "abgebrochenen Läufen sind es 50 von 134 (37,3 %).",
        "17 Läufe tragen über alle 10 Iterationen dieselbe Fehlersignatur, "
        "10 davon in uc-06.",
        "106 der 223 Fehlersignaturgruppen treten ausschließlich in "
        "abgebrochenen Läufen auf (544 von 1788 Fehl-Iterationen).",
        "122 Fehl-Iterationen melden abgefangene Pointer-Events, 143 nennen "
        "`map-container`, 70 nennen eine Chakra-Klasse, 153 einen nicht "
        "gefundenen oder mehrdeutigen `getByRole`-Locator.",
        "Token- und Generierungszeit sind nicht protokolliert; messbar ist nur "
        "der Faktor 4,31 an Generierungsaufrufen (2154 gegenüber 500).",
    ],
}

HYPOTHESEN = {
    1: [
        "Der hohe INFRA_FAIL-Anteil könnte daran liegen, dass ohne jede "
        "Selektorinformation überwiegend erfundene testids entstehen; diese "
        "scheitern schon beim Auflösen des Locators und erreichen keine "
        "inhaltliche Assertion.",
        "Die 68 `strict mode violation`-Fälle auf `locator('canvas')` könnten "
        "damit zusammenhängen, dass die Anwendung zwei `<canvas>`-Elemente "
        "rendert; das ist hier nicht überprüft.",
    ],
    2: [
        "Die Verschiebung von INFRA_FAIL zu ASSERTION_FAIL könnte daran "
        "liegen, dass der Accessibility-Snapshot echte Rollen und Namen "
        "liefert, sodass Locator auflösen und der Test bis zur Assertion "
        "kommt.",
        "Die 27 `Not an input element`-Fälle könnten daraus folgen, dass der "
        "Snapshot ein Chakra-Select als `combobox` beschreibt und daraus auf "
        "ein `<input>` geschlossen wird.",
    ],
    3: [
        "Der Sprung von `map_interaction_score` könnte auf die im Kontext "
        "mitgelieferte Helferdatei zurückgehen (83,4 % der Dateien importieren "
        "sie).",
        "Der Einbruch bei uc-02 und uc-03 könnte damit zusammenhängen, dass "
        "die Helferfunktionen `Promise`-Werte liefern und im Kontext nicht "
        "erklärt ist, dass `expect.poll` sie bereits auflöst.",
    ],
    4: [
        "Der Einbruch bei uc-04 gegenüber Stufe 3 könnte daran liegen, dass "
        "die manuelle UI-Map Layernamen auflistet und daraus "
        "`getByRole('checkbox', { name: 'UV-Index' })` ohne `exact: true` "
        "abgeleitet wird.",
        "Die vier Importpfad-Fehler in uc-06 könnten daran liegen, dass die "
        "Pfadangabe im Kontext und das Beispiel im Docstring der Helferdatei "
        "unterschiedliche Pfade nennen.",
    ],
    5: [
        "Die niedrige Behebungsquote aus ASSERTION_FAIL könnte damit "
        "zusammenhängen, dass die zurückgespielte Fehlermeldung auf "
        "500 Zeichen gekürzt ist und die eigentliche Ursache (z. B. der "
        "Typfehler beim Vergleich) außerhalb dieses Fensters liegt.",
        "Der mit den Iterationen steigende Anteil identischen Codes könnte "
        "darauf hindeuten, dass ohne neue Information keine andere Lösung "
        "gefunden wird; belegt ist nur die Ähnlichkeit, nicht die Ursache.",
        "Dass uc-03 die meisten Abbrüche stellt, könnte am Rückgabetyp von "
        "`getMapZoomLevel` liegen; belegt ist nur das Fehlerbild "
        "`Matcher error: ... must be a number or bigint`.",
    ],
}

VERGLEICH_AUFFAELLIG = [
    "Die PASS-Rate steigt über die Stufen 1-4 von 20,0 % auf 38,6 % und in "
    "Stufe 5 auf 73,2 %. Der größte Einzelschritt der Stufen 1-4 liegt "
    "zwischen Stufe 2 und 3 (+13,7 Prozentpunkte).",
    "INFRA_FAIL sinkt monoton von 345 auf 133 (Stufe 3), steigt in Stufe 4 "
    "wieder auf 145 und fällt in Stufe 5 auf 15. ASSERTION_FAIL steigt von 43 "
    "auf 184 (Stufe 3) und sinkt danach auf 118. Die Verschiebung von "
    "INFRA_FAIL zu ASSERTION_FAIL findet zwischen Stufe 1 und 2 statt "
    "(-134 / +123).",
    "COMPILE_ERROR bleibt über alle Stufen im einstelligen Bereich (3, 1, 3, "
    "4, 0). Mit Einführung der Helferdatei ab Stufe 3 entsteht ein neuer "
    "Fehlertyp: in Stufe 4 sind alle vier COMPILE_ERROR-Zeilen falsche "
    "Importpfade, in Stufe 3 alle drei Syntaxdefekte im generierten Code.",
    "GENERATION_ERROR (abgeschnittene oder degenerierte Ausgaben) sinkt von 9 "
    "und 12 auf 1 bis 4.",
    "uc-03 ist der einzige Use Case, dessen PASS-Rate über die Stufen "
    "insgesamt fällt (62 % → 18 %); uc-04 fällt von Stufe 3 auf Stufe 4 um "
    "54 Prozentpunkte und ist in Stufe 5 bei 100 %.",
    "`vacuous_pass` ist in Stufe 1 mit 33 Fällen am höchsten (33,0 % aller "
    "PASS) und liegt danach zwischen 3 und 15 Fällen (2,7 bis 7,8 % der "
    "PASS). Ab Stufe 3 konzentrieren sich die Fälle auf uc-07, uc-08 und "
    "uc-10.",
    "Die Nutzung der Map-Model-Helfer springt von 1 Datei (Stufen 1 und 2) auf "
    "416 (Stufe 3) und 370 (Stufe 4). `map_interaction_score` steigt parallel "
    "von Median 1 bzw. 2 auf 3.",
    "Der direkte Zugriff über `globalThis.__openPioneerMap` bleibt in allen "
    "Stufen selten (3 bis 30 Dateien); genutzt werden die fertigen "
    "Helferfunktionen, vor allem `isLayerRendered`.",
    "Die erste Iteration der Stufe 5 erreicht 29,2 % PASS gegenüber 22,0 % in "
    "Stufe 2. Der Kontext der Stufe 5 ist nicht identisch mit dem der Stufe 2: "
    "er enthält zusätzlich den vollständigen Quelltext der Helferdatei (siehe "
    "pruefprotokoll.md, Abschnitt 6).",
    "Assertions auf dem Kartencontainer statt auf einer Helferfunktion gehen "
    "von 176 Dateien (Stufe 1) auf 35 (Stufe 4) und 26 (Stufe 5, Endstand) "
    "zurück.",
    "`waitForTimeout` als einzige Wartestrategie ist durchgehend selten "
    "(0 bis 15 Dateien je Stufe); `expect.poll` steigt von 134 auf 419 "
    "Dateien.",
]

VERGLEICH_HYPOTHESEN = [
    "Der Sprung der ersten Iteration der Stufe 5 gegenüber Stufe 2 könnte "
    "durch die zusätzlich mitgelieferte Helferdatei erklärt werden, nicht "
    "durch den Loop selbst - der Loop wirkt erst ab Iteration 2.",
    "Dass Stufe 4 gegenüber Stufe 3 bei uc-04 einbricht, während der "
    "Stufendurchschnitt steigt, könnte daran liegen, dass die manuelle UI-Map "
    "mehr Layernamen nennt und damit mehr mehrdeutige Accessible Names "
    "anbietet.",
    "Der Rückgang von INFRA_FAIL bei gleichzeitigem Anstieg von "
    "ASSERTION_FAIL könnte bedeuten, dass zusätzlicher Kontext vor allem das "
    "Auffinden von Elementen verbessert und erst danach die inhaltliche "
    "Prüfung zum begrenzenden Faktor wird.",
]

AUFF_NOTES = [
    "Die zehn Zellen verteilen sich auf fünf Use Cases (uc-04 dreimal, "
    "uc-01, uc-02 und uc-03 je zweimal, uc-10 einmal). Vier der zehn Zellen "
    "haben keinen einzigen Fehlschlag (uc-01/Stufe 3, uc-01/Stufe 5, "
    "uc-02/Stufe 5, uc-04/Stufe 5); für sie entfällt Schritt B.",
    "In drei der sechs Zellen mit Fehlschlägen umfasst die größte "
    "Fehlermeldungsgruppe mehr als die Hälfte der Fehlschläge "
    "(uc-04/Stufe 4: 77,3 %, uc-03/Stufe 3: 58,3 %, uc-03/Stufe 4: 53,5 %); "
    "in den übrigen drei liegt sie zwischen 22,7 % und 42,9 %.",
    "In den Stichproben zu uc-03 (Stufen 3 und 4) verwenden alle geöffneten "
    "Dateien `getMapZoomLevel` über `expect.poll` und weisen dessen "
    "Rückgabewert einer Variablen zu (`const initialZoom = await "
    "expect.poll(...).toBeTruthy()`); `expect.poll(...)` liefert keinen Wert, "
    "der Folgevergleich erhält deshalb `undefined`.",
    "In den Stichproben zu uc-04 / Stufe 4 verwenden alle geöffneten Dateien "
    "`getByRole('checkbox', { name: 'UV-Index' })` ohne `exact: true`, klicken "
    "mit `force: true` und prüfen danach `toBeChecked()` sowie "
    "`isLayerRendered(page, 'UV-Index')`.",
    "In den Stichproben zu uc-01 (Stufe 3, 100 % PASS) greifen alle geöffneten "
    "Dateien ausschließlich auf `layer-switcher` und `layer-switcher-toggle` "
    "zu und prüfen die Sichtbarkeit des Panels.",
]

AUFF_HYPOTHESEN = [
    "Die Häufung von `Matcher error: ... must be a number or bigint` in uc-03 "
    "könnte daran liegen, dass im Kontext nicht steht, dass `expect.poll` "
    "keinen Wert zurückgibt.",
    "Die `strict mode violation` in uc-04 / Stufe 4 könnte daran liegen, dass "
    "die UI-Map die Layer `UV-Index` und `UV-Index Stations` nebeneinander "
    "auflistet, ohne auf die Namensüberlappung hinzuweisen.",
]


def md_bullets(title: str, items: list[str]) -> str:
    if not items:
        return ""
    return "\n".join([f"## {title}", ""] + [f"- {t}" for t in items] + [""])
