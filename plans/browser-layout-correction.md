# Browser-discovered fractional-label spacing correction

Actual final-candidate browser inspection of80d6be4 at1280px showed Kathmandu24h rail labels overlapping adjacent cells. The desktop1.75em cell minimum is narrower than a five-character time label. Mobile3.25em cells already fit. This is a presentation correction within004/008 Timeline scope, with no new product decision.

Use a shared cell minimum sufficient for fractional labels across all rows and breakpoints. Never widen only fractional rows: their absolute instant columns must stay aligned with whole-hour rows. Preserve25elapsed cells, precise instants, dividers, marker and hover geometry, both formats, themes and existing viewport clipping. The expected tradeoff is fewer visible cells in a desktop viewport; this follows the existing responsive rail behavior. No font shrinking or omitted minute text.

Executor owns the bounded Timeline source delta and focused checks/type/lint/build; primary owns actual label bounding-box/nonoverlap and cross-row alignment observations/screenshots on rebuilt production output. Staff must approve the exact delta. Existing257full-suite results remain predecessor evidence; a presentation-only delta receives affected checks without automatically repeating the complete suite. Record hashes and limits honestly in final validation.
