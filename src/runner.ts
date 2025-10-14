import path from "node:path";
import { DependencyAnalyzer } from "./analyzer";
import { ComponentClassifier } from "./classifier";
import { OutputFormatter } from "./formatter";

export interface AnalysisOptions {
	ignoreErrors?: boolean;
}

export async function runAnalysis(
	projectPath: string,
	options: AnalysisOptions = {},
): Promise<string> {
	if (!projectPath) {
		throw new Error("Project path must be provided.");
	}

	console.log(`Analyzing project at: ${projectPath}`);

	const analyzer = new DependencyAnalyzer(
		projectPath,
		{
			tsConfigFilePath: path.join(projectPath, "tsconfig.json"),
		},
		{
			// We can add options here in the future if needed
		},
	);

	try {
		const dependencyGraph = await analyzer.analyze({
			ignoreErrors: options.ignoreErrors,
		});
		const classifier = new ComponentClassifier();
		const classifiedComponents = classifier.classify(dependencyGraph);
		const formatter = new OutputFormatter(classifiedComponents, projectPath);
		const output = formatter.format();
		return output;
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error during analysis: ${error.message}`);
		} else {
			console.error("An unknown error occurred during analysis.");
		}
		throw error; // Re-throw the error to be caught by the caller
	}
}
