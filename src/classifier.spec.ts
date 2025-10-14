import { describe, expect, it } from "vitest";
import type { DependencyNode } from "./analyzer";
import { ComponentClassifier, ComponentType } from "./classifier";

describe("ComponentClassifier", () => {
	const classifier = new ComponentClassifier();

	it("should classify a component imported by a client component as a client component (forward propagation)", () => {
		// Arrange
		const graph = new Map<string, DependencyNode>([
			[
				"client.ts",
				{
					filePath: "client.ts",
					dependencies: new Set(["util.ts"]),
					isClientRoot: true,
				},
			],
			[
				"util.ts",
				{
					filePath: "util.ts",
					dependencies: new Set(),
					isClientRoot: false,
				},
			],
			[
				"server.ts",
				{
					filePath: "server.ts",
					dependencies: new Set(),
					isClientRoot: false,
				},
			],
		]);

		// Act
		const result = classifier.classify(graph);

		// Assert
		expect(result.get("client.ts")?.type).toBe(ComponentType.Client);
		expect(result.get("util.ts")?.type).toBe(ComponentType.Client); // Should be propagated to client
		expect(result.get("server.ts")?.type).toBe(ComponentType.Server); // Should remain server
	});

	it("should classify components without directives or imports as Server Components", () => {
		// Arrange
		const graph = new Map<string, DependencyNode>([
			[
				"component.ts",
				{
					filePath: "component.ts",
					dependencies: new Set(),
					isClientRoot: false,
				},
			],
		]);

		// Act
		const result = classifier.classify(graph);

		// Assert
		expect(result.get("component.ts")?.type).toBe(ComponentType.Server);
	});
});
