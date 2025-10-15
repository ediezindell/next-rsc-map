import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runAnalysis } from "./runner"; // Test the runner directly

describe("Integration Test", () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
	});

	it("should analyze the sample project and produce the correct output tree", async () => {
		// Arrange
		const projectPath = path.resolve("tests/fixtures/sample-next-project");

		// Act
		const output = await runAnalysis(projectPath, { ignoreErrors: true });

		// Assert
		const normalize = (str: string) => str.replace(/\\/g, "/");
		const normalizedOutput = normalize(output);

		const expectedHeader = `Analyzing project at: ${normalize(projectPath)}`;
		const expectedTreeHeader = normalize(projectPath);

		// This reflects the corrected classification logic
		const expectedTree = [
			expectedTreeHeader,
			"└── 📁 app (🔴 3, 🟢 3)",
			"   ├── 📁 components (🔴 3, 🟢 1)",
			"   │  ├── 🔴 another-client-component.tsx",
			"   │  ├── 🔴 client-component.tsx",
			"   │  ├── 📁 common (🔴 1)",
			"   │  │  └── 🔴 Timestamp.tsx",
			"   │  └── 🟢 server-component.tsx",
			"   ├── 🟢 layout.tsx",
			"   └── 🟢 page.tsx",
			"",
			"Total: 🔴 3, 🟢 3",
			"",
			"🔴: Client Component",
			"🟢: Server Component",
		];

		// Check the "Analyzing..." log message which is logged separately
		expect(consoleLogSpy).toHaveBeenCalledWith(expectedHeader);

		// Check the formatted tree output line by line for better debugging
		expect(normalizedOutput.split("\n")).toEqual(expectedTree);
	}, 30000);

	it("should throw an error for a project with TypeScript errors if --ignore-errors is not set", async () => {
		// Arrange
		const projectPath = path.resolve("tests/fixtures/project-with-errors");

		// Act & Assert
		await expect(
			runAnalysis(projectPath, { ignoreErrors: false }),
		).rejects.toThrow(/TypeScript compilation errors found/);
	});

	it("should succeed for a project with TypeScript errors if --ignore-errors is set", async () => {
		// Arrange
		const projectPath = path.resolve("tests/fixtures/project-with-errors");

		// Act
		const output = await runAnalysis(projectPath, { ignoreErrors: true });

		// Assert
		const normalize = (str: string) => str.replace(/\\/g, "/");
		const normalizedOutput = normalize(output);
		const expectedHeader = normalize(projectPath);
		const expectedTree = [
			expectedHeader,
			"└── 🟢 error.tsx", // Should be classified as Server by default
			"",
			"Total: 🟢 1",
			"",
			"🔴: Client Component",
			"🟢: Server Component",
		].join("\n");

		expect(normalizedOutput).toEqual(expectedTree);
	});

	it("should log the dependency chain when --why is used for a propagated client module", async () => {
		// Arrange
		const projectPath = path.resolve("tests/fixtures/sample-next-project");
		// Target the new utils.ts file, which is a client module due to being imported by a client component.
		const targetFile = path.join(
			projectPath,
			"app/components/common/Timestamp.tsx",
		);

		// Act
		await runAnalysis(projectPath, { ignoreErrors: true, why: targetFile });

		// Assert
		const logOutput = consoleLogSpy.mock.calls.map((c) => c[0]).join("\n");

		// The root of this chain is client-component.tsx
		const clientRoot = path.join(
			projectPath,
			"app/components/client-component.tsx",
		);
		const relativeTarget = path.relative(projectPath, targetFile);
		const relativeRoot = path.relative(projectPath, clientRoot);

		// Construct the correct expected output for the new target
		const expectedOutput = [
			`Dependency trace for ${relativeTarget} to a 'use client' boundary:`,
			`Dependency chain:`,
			``,
			`${relativeRoot}  (contains "use client")`,
			`  └─▶ ${relativeTarget}  <- Target file`,
		].join("\n");
		expect(logOutput).toContain(expectedOutput);
	});
});
