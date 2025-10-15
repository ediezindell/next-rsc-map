import type { DependencyNode } from "./types";

export class DependencyTracer {
	traceToClientRoot(
		graph: Map<string, DependencyNode>,
		targetFile: string,
	): string[] | null {
		const startNode = graph.get(targetFile);
		if (!startNode) {
			return null;
		}

		// Breadth-First Search to find the shortest path to a client root
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
				// The chain is from target -> root, so we reverse it to show root -> target.
				return currentChain.reverse();
			}

			if (currentNode) {
				for (const dependencyPath of currentNode.dependencies) {
					if (!visited.has(dependencyPath)) {
						visited.add(dependencyPath);
						const newChain = [...currentChain, dependencyPath];
						queue.push({ path: dependencyPath, chain: newChain });
					}
				}
			}
		}

		return null; // No path to a client root found
	}
}
