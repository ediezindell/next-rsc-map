import { describe, expect, it } from "vitest";
import { ComponentClassifier } from "./classifier";
import type { DependencyNode } from "./types";

describe("ComponentClassifier", () => {
	const classifier = new ComponentClassifier();

	it("should classify a component as Server even if it imports a Client component", () => {
		// Arrange
		const graph = new Map<string, DependencyNode>([
			[
				"component-a.ts",
				{
					path: "component-a.ts",
					dependencies: ["client-util.ts"],
					importedBy: [],
					isClient: false,
					isClientRoot: false,
				},
			],
			[
				"client-util.ts",
				{
					path: "client-util.ts",
					dependencies: [],
					importedBy: ["component-a.ts"],
					isClient: false,
					isClientRoot: true, // This is the client root
				},
			],
			[
				"server-component.ts",
				{
					path: "server-component.ts",
					dependencies: [],
					importedBy: [],
					isClient: false,
					isClientRoot: false,
				},
			],
		]);

		// Act
		const result = classifier.classify(graph);

		// Assert
		expect(result.get("client-util.ts")?.isClient).toBe(true);
		expect(result.get("component-a.ts")?.isClient).toBe(false); // Should NOT be propagated upwards
		expect(result.get("server-component.ts")?.isClient).toBe(false);
	});

	it("should classify a component imported BY a client component as client", () => {
		// Arrange
		const graph = new Map<string, DependencyNode>([
			[
				"client-root.ts",
				{
					path: "client-root.ts",
					dependencies: ["client-dependency.ts"],
					importedBy: [],
					isClient: false,
					isClientRoot: true,
				},
			],
			[
				"client-dependency.ts",
				{
					path: "client-dependency.ts",
					dependencies: [],
					importedBy: ["client-root.ts"],
					isClient: false,
					isClientRoot: false,
				},
			],
		]);

		// Act
		const result = classifier.classify(graph);

		// Assert
		expect(result.get("client-root.ts")?.isClient).toBe(true);
		expect(result.get("client-dependency.ts")?.isClient).toBe(true); // Should be propagated downwards
	});

	it("should classify components without directives or imports as Server Components", () => {
		// Arrange
		const graph = new Map<string, DependencyNode>([
			[
				"component.ts",
				{
					path: "component.ts",
					dependencies: [],
					importedBy: [],
					isClient: false,
					isClientRoot: false,
				},
			],
		]);

		// Act
		const result = classifier.classify(graph);

		// Assert
		expect(result.get("component.ts")?.isClient).toBe(false);
	});
});
