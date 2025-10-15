import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { type ClassifiedComponent, ComponentType } from "./classifier";
import { OutputFormatter } from "./formatter";

describe("OutputFormatter", () => {
	it("should format a simple component map into a tree", () => {
		// Arrange
		const projectPath = path.resolve("/test-project");
		const components = new Map<string, ClassifiedComponent>([
			[
				path.join(projectPath, "app", "page.tsx"),
				{
					filePath: path.join(projectPath, "app", "page.tsx"),
					type: ComponentType.Server,
				},
			],
			[
				path.join(projectPath, "app", "components", "button.tsx"),
				{
					filePath: path.join(projectPath, "app", "components", "button.tsx"),
					type: ComponentType.Client,
				},
			],
		]);
		const formatter = new OutputFormatter(components, projectPath);

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
			"🟢: Server Component",
			"🔴: Client Component",
		].join("\n");
		expect(output.replace(/\\/g, "/")).toBe(expected.replace(/\\/g, "/"));
	});

	it("should display summary counts for directories and total", () => {
		// Arrange
		const projectPath = path.resolve("/test-project");
		const components = new Map<string, ClassifiedComponent>([
			[
				path.join(projectPath, "app", "page.tsx"),
				{
					filePath: path.join(projectPath, "app", "page.tsx"),
					type: ComponentType.Server,
				},
			],
			[
				path.join(projectPath, "app", "layout.tsx"),
				{
					filePath: path.join(projectPath, "app", "layout.tsx"),
					type: ComponentType.Server,
				},
			],
			[
				path.join(projectPath, "app", "components", "button.tsx"),
				{
					filePath: path.join(projectPath, "app", "components", "button.tsx"),
					type: ComponentType.Client,
				},
			],
			[
				path.join(projectPath, "app", "components", "card.tsx"),
				{
					filePath: path.join(projectPath, "app", "components", "card.tsx"),
					type: ComponentType.Client,
				},
			],
		]);
		const formatter = new OutputFormatter(components, projectPath);

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
			"🟢: Server Component",
			"🔴: Client Component",
		].join("\n");
		expect(output.replace(/\\/g, "/")).toBe(expected.replace(/\\/g, "/"));
	});

	it("should throw an error if components map is not provided", () => {
		// Arrange, Act, Assert
		// @ts-expect-error - Testing invalid input
		expect(() => new OutputFormatter(undefined)).toThrow(
			"Components map must be provided to OutputFormatter.",
		);
	});
});
