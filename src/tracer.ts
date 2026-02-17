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

		const queue: { path: string; parentIndex: number }[] = [
			{ path: targetFile, parentIndex: -1 },
		];
		const visited = new Set<string>([targetFile]);
		let head = 0;

		while (head < queue.length) {
			const { path: currentPath } = queue[head++];
			const currentNode = graph.get(currentPath);

			if (currentNode?.isClientRoot) {
				// We found the root of the client component chain.
				// Reconstruct the chain from the queue using parent pointers
				const chain: string[] = [];
				let currentIdx = head - 1;
				while (currentIdx !== -1) {
					chain.push(queue[currentIdx].path);
					currentIdx = queue[currentIdx].parentIndex;
				}
				return chain;
			}

			if (currentNode) {
				for (const importerPath of currentNode.importedBy) {
					if (!visited.has(importerPath)) {
						visited.add(importerPath);
						queue.push({ path: importerPath, parentIndex: head - 1 });
					}
				}
			}
		}

		return null; // No path to a client root found
	}
}
