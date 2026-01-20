# Bolt's Journal

## 2026-01-20 - Batch adding source files in ts-morph
**Learning:** `project.addSourceFilesAtPaths(files)` was significantly slower (~3-4x) than iterating and calling `project.addSourceFileAtPath(file)` for a list of absolute paths.
**Action:** Do not assume batch operations are always faster in `ts-morph` when we already have the list of files. Benchmark first.
