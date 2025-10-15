export interface DependencyNode {
	path: string;
	dependencies: string[];
	importedBy: string[];
	isClient: boolean;
	isClientRoot: boolean;
}
