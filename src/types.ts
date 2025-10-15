export interface DependencyNode {
	path: string;
	dependencies: Set<string>;
	importedBy: string[];
	isClient: boolean;
	isClientRoot: boolean;
}
