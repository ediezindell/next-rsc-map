#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { runAnalysis } from "./runner";

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
		.help()
		.alias("h", "help").argv;

	const projectPath = parsedArgv.projectPath as string;
	const ignoreErrors = parsedArgv.ignoreErrors as boolean;

	try {
		const output = await runAnalysis(projectPath, { ignoreErrors });
		console.log(output);
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
