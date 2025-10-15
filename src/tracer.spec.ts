import { describe, expect, it } from "vitest";
import { DependencyTracer } from "./tracer";
import type { DependencyNode } from "./types";

describe("DependencyTracer", () => {
	it("should trace the shortest path back to a client root", () => {
		// Arrange
		const projectRoot = "/home/edie/git/next-rsc-map";
		const pagePath = `${projectRoot}/src/app/page.tsx`;
		const componentAPath = `${projectRoot}/src/components/component-a.tsx`;
		const componentBPath = `${projectRoot}/src/components/component-b.tsx`;
		const serverComponentPath = `${projectRoot}/src/components/server-component.tsx`;

		const mockGraph = new Map<string, DependencyNode>([
			[
				pagePath,
				{
					path: pagePath,
					dependencies: [],
					importedBy: [componentAPath],
					isClient: true,
					isClientRoot: true, // This is the root cause
				},
			],
			[
				componentAPath,
				{
					path: componentAPath,
					dependencies: [pagePath],
					importedBy: [componentBPath],
					isClient: true,
					isClientRoot: false,
				},
			],
			[
				componentBPath,
				{
					path: componentBPath,
					dependencies: [componentAPath],
					importedBy: [],
					isClient: true,
					isClientRoot: false,
				},
			],
			[
				serverComponentPath,
				{
					path: serverComponentPath,
					dependencies: [],
					importedBy: [],
					isClient: false,
					isClientRoot: false,
				},
			],
		]);

		const tracer = new DependencyTracer();
		const targetFile = componentBPath;

		// Act
		const chain = tracer.traceToClientRoot(mockGraph, targetFile);

		// Assert
		const expectedChain = [pagePath, componentAPath, componentBPath];
		expect(chain).toEqual(expectedChain);
	});
});
