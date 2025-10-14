import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { DependencyAnalyzer } from "./analyzer";

const tsConfigContent = JSON.stringify({
	compilerOptions: {
		target: "esnext",
		module: "esnext",
		moduleResolution: "node",
	},
});

describe("analyze", () => {
	const testDir = resolve("./tests/fixtures/test-project-analyze");
	const directivesDir = resolve("./tests/fixtures/directives-project-analyze");

	beforeAll(async () => {
		await rm(testDir, { recursive: true, force: true });
		await rm(directivesDir, { recursive: true, force: true });
		await mkdir(testDir, { recursive: true });
		await mkdir(directivesDir, { recursive: true });
		await writeFile(join(testDir, "tsconfig.json"), tsConfigContent);
		await writeFile(join(directivesDir, "tsconfig.json"), tsConfigContent);
	});

	it("should identify a simple import", async () => {
		// Arrange
		const mainPath = join(testDir, "main.tsx");
		const depPath = join(testDir, "dep.tsx");
		// Make the import more realistic with an export/import
		await writeFile(
			mainPath,
			`import { foo } from "./dep.tsx"; console.log(foo);`,
		);
		await writeFile(depPath, `export const foo = "bar";`);

		const analyzer = new DependencyAnalyzer(testDir, {
			tsConfigFilePath: join(testDir, "tsconfig.json"),
		});

		// Act
		const graph = await analyzer.analyze({ ignoreErrors: true });

		// Assert
		const mainFile = graph.get(mainPath);
		const depFile = graph.get(depPath);
		expect(mainFile?.dependencies.has(depPath)).toBe(true);
		expect(depFile?.dependencies.size).toBe(0);
	});

	it(`should detect "use client" directive`, async () => {
		// Arrange
		const clientPath = join(directivesDir, "client.tsx");
		const nonePath = join(directivesDir, "none.tsx");
		await writeFile(clientPath, `"use client";`);
		await writeFile(nonePath, "");

		const analyzer = new DependencyAnalyzer(directivesDir, {
			tsConfigFilePath: join(directivesDir, "tsconfig.json"),
		});

		// Act
		const graph = await analyzer.analyze({ ignoreErrors: true });

		// Assert
		const clientFile = graph.get(clientPath);
		const noneFile = graph.get(nonePath);
		expect(clientFile?.isClientRoot).toBe(true);
		expect(noneFile?.isClientRoot).toBe(false);
	});
});
