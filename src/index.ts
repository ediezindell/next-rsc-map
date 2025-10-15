#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { runAnalysis } from "./runner";

// Helper function to find the project root by looking for package.json
function findProjectRoot(startPath: string): string | null {
	let currentPath = fs.lstatSync(startPath).isDirectory()
		? startPath
		: path.dirname(startPath);

	while (currentPath !== path.dirname(currentPath)) {
		const packageJsonPath = path.join(currentPath, "package.json");
		if (fs.existsSync(packageJsonPath)) {
			return currentPath;
		}
		currentPath = path.dirname(currentPath);
	}
	return null;
}

export async function main(argv?: string[]) {
	const processedArgs = argv ?? hideBin(process.argv);

	const parsedArgv = await yargs(processedArgs)
		.command("$0 [projectPath]", "Analyze a Next.js project", (yargs) => {
			return yargs.positional("projectPath", {
				describe:
					"Path to the Next.js project directory. Defaults to the current directory.",
				type: "string",
				normalize: true,
				default: ".",
			});
		})
		.option("ignore-errors", {
			alias: "i",
			type: "boolean",
			description: "Ignore TypeScript parsing errors",
			default: false,
		})
		.option("why", {
			type: "string",
			description:
				"Trace the dependency chain for a file to see why it is a client component.",
			normalize: true,
		})
		.help()
		.alias("h", "help").argv;

	let projectPath = parsedArgv.projectPath as string;
	const ignoreErrors = parsedArgv.ignoreErrors as boolean;
	const why = parsedArgv.why as string | undefined;

	// If --why is an absolute path and projectPath is the default, infer the project root
	if (why && path.isAbsolute(why) && parsedArgv.projectPath === ".") {
		const inferredRoot = findProjectRoot(why);
		if (inferredRoot) {
			projectPath = inferredRoot;
			console.log(`Project root inferred from --why path: ${projectPath}`);
		}
	}

	try {
		const output = await runAnalysis(projectPath, { ignoreErrors, why });
		if (output) {
			console.log(output);
		}
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`);
		} else {
			console.error("An unknown error occurred.");
		}
		process.exit(1);
	}
}

// Execute main only if the script is run directly
if (require.main === module) {
	main();
}
