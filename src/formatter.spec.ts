import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { OutputFormatter } from "./formatter";
import type { DependencyNode } from "./types";

describe("OutputFormatter", () => {
	it("should format a simple component map into a tree", () => {
		// Arrange
		const projectPath = path.resolve("/test-project");
		const pagePath = path.join(projectPath, "app", "page.tsx");
		const buttonPath = path.join(
			projectPath,
			"app",
			"components",
			"button.tsx",
		);

		const graph = new Map<string, DependencyNode>([
			[
				pagePath,
				{
					path: pagePath,
					isClient: false,
					dependencies: [],
					importedBy: [],
					isClientRoot: false,
				},
			],
			[
				buttonPath,
				{
					path: buttonPath,
					isClient: true,
					dependencies: [],
					importedBy: [],
					isClientRoot: true,
				},
			],
		]);
		const formatter = new OutputFormatter(graph, projectPath);

		// Act
		const output = formatter.format();

		// Assert
		const expected = [
			projectPath,
			"└── 📁 app (🔴 1, 🟢 1)",
			"   ├── 📁 components (🔴 1)",
			"   │  └── 🔴 button.tsx",
			"   └── 🟢 page.tsx",
			"",
			"Total: 🔴 1, 🟢 1",
			"",
			"🔴: Client Component",
			"🟢: Server Component",
		].join("\n");
		expect(output.replace(/\\/g, "/")).toBe(expected.replace(/\\/g, "/"));
	});

	it("should display summary counts for directories and total", () => {
		// Arrange
		const projectPath = path.resolve("/test-project");
		const pagePath = path.join(projectPath, "app", "page.tsx");
		const layoutPath = path.join(projectPath, "app", "layout.tsx");
		const buttonPath = path.join(
			projectPath,
			"app",
			"components",
			"button.tsx",
		);
		const cardPath = path.join(projectPath, "app", "components", "card.tsx");

		const graph = new Map<string, DependencyNode>([
			[
				pagePath,
				{
					path: pagePath,
					isClient: false,
					dependencies: [],
					importedBy: [],
					isClientRoot: false,
				},
			],
			[
				layoutPath,
				{
					path: layoutPath,
					isClient: false,
					dependencies: [],
					importedBy: [],
					isClientRoot: false,
				},
			],
			[
				buttonPath,
				{
					path: buttonPath,
					isClient: true,
					dependencies: [],
					importedBy: [],
					isClientRoot: true,
				},
			],
			[
				cardPath,
				{
					path: cardPath,
					isClient: true,
					dependencies: [],
					importedBy: [],
					isClientRoot: true,
				},
			],
		]);
		const formatter = new OutputFormatter(graph, projectPath);

		// Act
		const output = formatter.format();

		// Assert
		const expected = [
			projectPath,
			"└── 📁 app (🔴 2, 🟢 2)",
			"   ├── 📁 components (🔴 2)",
			"   │  ├── 🔴 button.tsx",
			"   │  └── 🔴 card.tsx",
			"   ├── 🟢 layout.tsx",
			"   └── 🟢 page.tsx",
			"",
			"Total: 🔴 2, 🟢 2",
			"",
			"🔴: Client Component",
			"🟢: Server Component",
		].join("\n");
		expect(output.replace(/\\/g, "/")).toBe(expected.replace(/\\/g, "/"));
	});

	it("should throw an error if graph map is not provided", () => {
		// Arrange, Act, Assert
		// @ts-expect-error We are intentionally passing an invalid type to test the constructor's error handling.
		expect(() => new OutputFormatter(undefined)).toThrow(
			"Graph map must be provided to OutputFormatter.",
		);
	});
});
