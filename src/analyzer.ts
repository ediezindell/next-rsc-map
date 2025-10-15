import { join, resolve } from "node:path";
import fg from "fast-glob";
import { Node, Project, type ProjectOptions, type SourceFile } from "ts-morph";
import type { DependencyNode } from "./types";

export interface AnalyzerOptions {
	glob: string[];
	ignore: string[];
}

export class DependencyAnalyzer {
	private projectPath: string;
	private projectOptions: ProjectOptions;
	private options: AnalyzerOptions;

	constructor(
		projectPath: string,
		projectOptions: ProjectOptions = {},
		analyzerOptions: Partial<AnalyzerOptions> = {},
	) {
		this.projectPath = resolve(projectPath);
		this.projectOptions = {
			...projectOptions,
			tsConfigFilePath: join(this.projectPath, "tsconfig.json"),
			skipAddingFilesFromTsConfig: true,
		};
		this.options = {
			glob: analyzerOptions.glob ?? ["**/*.{tsx,jsx}"],
			ignore: analyzerOptions.ignore ?? [
				"node_modules",
				".next",
				"dist",
				"out",
				"build",
				"coverage",
				"**/*.test.*",
				"**/*.spec.*",
				"**/*.stories.*",
				"**/__tests__/**",
				"**/__mocks__/**",
				".storybook/**",
				"app/api/**",
				"pages/api/**",
				"public/**",
				"scripts/**",
				"config/**",
				"cypress/**",
				"playwright/**",
			],
		};
	}

	async analyze(
		options: { ignoreErrors?: boolean } = {},
	): Promise<Map<string, DependencyNode>> {
		const project = new Project(this.projectOptions);

		const files = await fg(this.options.glob, {
			cwd: this.projectPath,
			absolute: true,
			ignore: this.options.ignore,
		});

		for (const file of files) {
			project.addSourceFileAtPath(file);
		}

		// Only check for diagnostics if ignoreErrors is not explicitly true
		if (!options.ignoreErrors) {
			const diagnostics = project.getPreEmitDiagnostics();
			if (diagnostics.length > 0) {
				const formattedDiagnostics = diagnostics
					.slice(0, 10) // Limit output for readability
					.map((diagnostic) => {
						const message = diagnostic.getMessageText();
						const sourceFile = diagnostic.getSourceFile();
						if (sourceFile) {
							const start = diagnostic.getStart();
							if (start) {
								const { line, column } =
									sourceFile.getLineAndColumnAtPos(start);
								return `${sourceFile.getFilePath()}:${line}:${column} - ${message}`;
							}
							return `${sourceFile.getFilePath()} - ${message}`;
						}
						return `Unknown file: ${message}`;
					})
					.join("\n");
				throw new Error(
					`TypeScript compilation errors found. Use --ignore-errors to proceed.\n${formattedDiagnostics}`,
				);
			}
		}

		const graph = new Map<string, DependencyNode>();
		for (const sourceFile of project.getSourceFiles()) {
			const filePath = sourceFile.getFilePath();
			if (filePath.includes("/node_modules/")) {
				continue;
			}

			const dependencies: string[] = [];

			for (const importDeclaration of sourceFile.getImportDeclarations()) {
				const resolvedModule = importDeclaration.getModuleSpecifierSourceFile();
				if (resolvedModule) {
					const dependencyPath = resolvedModule.getFilePath();
					if (!dependencyPath.includes("/node_modules/")) {
						dependencies.push(dependencyPath);
					}
				}
			}

			const isClientRoot = this._hasDirective(sourceFile, "use client");

			graph.set(filePath, {
				path: filePath,
				dependencies,
				isClientRoot,
				importedBy: [],
				isClient: false, // Default value, will be updated by classifier
			});
		}

		// Build the reverse dependency graph (importedBy)
		for (const [filePath, node] of graph.entries()) {
			for (const dependencyPath of node.dependencies) {
				const dependencyNode = graph.get(dependencyPath);
				if (dependencyNode) {
					dependencyNode.importedBy.push(filePath);
				}
			}
		}

		return graph;
	}

	private _hasDirective(sourceFile: SourceFile, directive: string): boolean {
		const firstStatement = sourceFile.getStatements()[0];
		if (Node.isExpressionStatement(firstStatement)) {
			const expression = firstStatement.getExpression();
			if (Node.isStringLiteral(expression)) {
				return expression.getLiteralValue() === directive;
			}
		}
		return false;
	}

	getOptions(): AnalyzerOptions {
		return this.options;
	}
}
