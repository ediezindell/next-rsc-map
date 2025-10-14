import type { DependencyNode } from "./analyzer";

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
	classify(
		graph: Map<string, DependencyNode>,
	): Map<string, ClassifiedComponent> {
		const classified = this._initializeAsServerComponents(graph);
		this._propagateClientStatus(graph, classified);
		return classified;
	}

	private _initializeAsServerComponents(
		graph: Map<string, DependencyNode>,
	): Map<string, ClassifiedComponent> {
		const classified = new Map<string, ClassifiedComponent>();
		for (const filePath of graph.keys()) {
			classified.set(filePath, { filePath, type: ComponentType.Server });
		}
		return classified;
	}

	private _propagateClientStatus(
		graph: Map<string, DependencyNode>,
		classified: Map<string, ClassifiedComponent>,
	): void {
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

			classified.set(currentPath, {
				filePath: currentPath,
				type: ComponentType.Client,
			});

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
