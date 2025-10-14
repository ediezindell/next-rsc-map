import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DependencyAnalyzer } from "./analyzer";

describe("analyze", () => {
	it("should exclude files based on hardcoded glob patterns", async () => {
		// Arrange
		const projectPath = "./tests/fixtures/fast-glob-project";
		const analyzer = new DependencyAnalyzer(projectPath);

		// Act
		const graph = await analyzer.analyze({ ignoreErrors: true });

		// Assert
		const filePaths = Array.from(graph.keys());
		const relativeFilePaths = filePaths.map((fp) =>
			fp.replace(`${resolve(projectPath)}/`, ""),
		);

		expect(relativeFilePaths).toHaveLength(1);
		expect(relativeFilePaths).toContain("src/components/Button.tsx");
		expect(relativeFilePaths).not.toContain("src/index.ts");
		expect(relativeFilePaths).not.toContain("src/components/Button.spec.tsx");
		expect(relativeFilePaths).not.toContain("app/api/hello.ts");
	});
});
