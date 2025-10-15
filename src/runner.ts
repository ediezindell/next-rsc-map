import * as path from "node:path";
import { DependencyAnalyzer } from "./analyzer";
import { ComponentClassifier } from "./classifier";
import { OutputFormatter } from "./formatter";

import { DependencyTracer } from "./tracer";

export interface AnalysisOptions {
	ignoreErrors?: boolean;
}

export async function runAnalysis(
	projectPath: string,
	options: { ignoreErrors?: boolean; why?: string },
) {
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
		const classifiedGraph = classifier.classify(dependencyGraph);

		if (options.why) {
			const absoluteWhyPath = path.isAbsolute(options.why)
				? options.why
				: path.resolve(projectPath, options.why);

			const tracer = new DependencyTracer();
			const chain = tracer.traceToClientRoot(classifiedGraph, absoluteWhyPath);

			const formatter = new OutputFormatter(classifiedGraph, projectPath);
			const output = formatter.formatWhyChain(chain, absoluteWhyPath);

			console.log(output);

			return ""; // Return empty string to signify completion
		}

		const formatter = new OutputFormatter(classifiedGraph, projectPath);
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
