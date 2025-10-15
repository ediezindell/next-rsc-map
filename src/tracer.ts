import type { DependencyNode } from "./types";

export class DependencyTracer {
	traceToClientRoot(
		graph: Map<string, DependencyNode>,
		targetFile: string,
	): string[] | null {
		const startNode = graph.get(targetFile);
		if (!startNode || !startNode.isClient) {
			return null;
		}

		const queue: { path: string; chain: string[] }[] = [
			{ path: targetFile, chain: [targetFile] },
		];
		const visited = new Set<string>([targetFile]);

		while (queue.length > 0) {
			const nextInQueue = queue.shift();
			if (!nextInQueue) {
				continue;
			}
			const { path: currentPath, chain: currentChain } = nextInQueue;
			const currentNode = graph.get(currentPath);

			if (currentNode?.isClientRoot) {
				// We found the root of the client component chain.
				return currentChain;
			}

			if (currentNode) {
				for (const importerPath of currentNode.importedBy) {
					if (!visited.has(importerPath)) {
						visited.add(importerPath);
						const newChain = [importerPath, ...currentChain];
						queue.push({ path: importerPath, chain: newChain });
					}
				}
			}
		}

		return null; // No path to a client root found
	}
}
