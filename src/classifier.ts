import type { DependencyNode } from "./types";

export enum ComponentType {
	Server = "server",
	Client = "client",
	Unknown = "unknown",
}

export interface ClassifiedComponent {
	filePath: string;
	type: ComponentType;
}

export class ComponentClassifier {
	classify(graph: Map<string, DependencyNode>): Map<string, DependencyNode> {
		// First, reset and assume all are server components
		for (const node of graph.values()) {
			node.isClient = false;
		}

		this._propagateClientStatus(graph);
		return graph;
	}

	private _propagateClientStatus(graph: Map<string, DependencyNode>): void {
		const clientRoots = new Set<string>();
		for (const [filePath, node] of graph.entries()) {
			if (node.isClientRoot) {
				clientRoots.add(filePath);
			}
		}

		const queue = [...clientRoots];
		const visited = new Set<string>(clientRoots);

		while (queue.length > 0) {
			const currentPath = queue.shift();
			if (!currentPath) {
				continue;
			}

			const nodeToUpdate = graph.get(currentPath);
			if (nodeToUpdate) {
				nodeToUpdate.isClient = true;
			}

			const node = graph.get(currentPath);
			if (node) {
				for (const dependencyPath of node.dependencies) {
					if (!visited.has(dependencyPath)) {
						visited.add(dependencyPath);
						queue.push(dependencyPath);
					}
				}
			}
		}
	}
}
