import { describe, expect, it } from "vitest";
import { DependencyTracer } from "./tracer";
import type { DependencyNode } from "./types";

describe("DependencyTracer", () => {
	it("should return null for a Server Component that imports a Client Component indirectly", () => {
		// Arrange
		const projectRoot = "/test-project";
		const serverPagePath = `${projectRoot}/server-page.tsx`;
		const serverLayoutPath = `${projectRoot}/server-layout.tsx`;
		const clientComponentPath = `${projectRoot}/client-component.tsx`;

		const mockGraph = new Map<string, DependencyNode>([
			[
				serverPagePath,
				{
					path: serverPagePath,
					dependencies: [serverLayoutPath], // Imports server-layout
					importedBy: [],
					isClient: false,
					isClientRoot: false,
				},
			],
			[
				serverLayoutPath,
				{
					path: serverLayoutPath,
					dependencies: [clientComponentPath], // Imports client-component
					importedBy: [serverPagePath],
					isClient: false,
					isClientRoot: false,
				},
			],
			[
				clientComponentPath,
				{
					path: clientComponentPath,
					dependencies: [],
					importedBy: [serverLayoutPath],
					isClient: true,
					isClientRoot: true, // The "use client" boundary
				},
			],
		]);

		const tracer = new DependencyTracer();
		const targetFile = serverPagePath;

		// Act
		const chain = tracer.traceToClientRoot(mockGraph, targetFile);

		// Assert
		expect(chain).toBeNull();
	});

	it("should trace the shortest path back to a client root", () => {
		// Arrange
		const projectRoot = "/home/edie/git/next-rsc-map";
		const pagePath = `${projectRoot}/src/app/page.tsx`;
		const componentAPath = `${projectRoot}/src/components/component-a.tsx`;
		const componentBPath = `${projectRoot}/src/components/component-b.tsx`;
		const serverComponentPath = `${projectRoot}/src/components/server-component.tsx`;

		// This graph represents the chain: page.tsx -> component-a.tsx -> component-b.tsx
		const mockGraph = new Map<string, DependencyNode>([
			[
				pagePath,
				{
					path: pagePath,
					dependencies: [componentAPath],
					importedBy: [],
					isClient: true,
					isClientRoot: true, // The root of the chain
				},
			],
			[
				componentAPath,
				{
					path: componentAPath,
					dependencies: [componentBPath],
					importedBy: [pagePath],
					isClient: true,
					isClientRoot: false,
				},
			],
			[
				componentBPath,
				{
					path: componentBPath,
					dependencies: [],
					importedBy: [componentAPath],
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
