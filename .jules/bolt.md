# Bolt's Journal

## 2026-01-20 - Batch adding source files in ts-morph
**Learning:** `project.addSourceFilesAtPaths(files)` was significantly slower (~3-4x) than iterating and calling `project.addSourceFileAtPath(file)` for a list of absolute paths.
**Action:** Do not assume batch operations are always faster in `ts-morph` when we already have the list of files. Benchmark first.

## 2025-05-15 - Module Resolution Caching and BFS Optimization
**Learning:**
1. Using `ts.createModuleResolutionCache` can speed up module resolution by ~15x in projects with many shared imports.
2. Avoiding array spreads in BFS chains and using a pointer-based queue reduces complexity from $O(D^2)$ to $O(V+E)$, providing a ~5x speedup even on small graphs and much more on deep ones.
**Action:** Always use `ModuleResolutionCache` when doing manual module resolution in TS. Prefer parent pointers over array copying for path tracing in graphs.
