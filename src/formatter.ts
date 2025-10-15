import * as path from "node:path";
import { type ClassifiedComponent, ComponentType } from "./classifier";

interface TreeNode {
	name: string;
	component?: ClassifiedComponent;
	children: Map<string, TreeNode>;
	summary: Map<ComponentType, number>;
}

export class OutputFormatter {
	private components: Map<string, ClassifiedComponent>;
	private projectPath: string;
	constructor(
		components: Map<string, ClassifiedComponent>,
		projectPath?: string,
	) {
		if (!components) {
			throw new Error("Components map must be provided to OutputFormatter.");
		}
		this.components = components;
		this.projectPath =
			projectPath ?? this._findCommonBasePath([...components.keys()]);
	}

	format(): string {
		const root = this._buildTree();
		let output = this.projectPath;
		output += this._formatTreeNodes(root, "");

		const totalSummary = this._formatSummaryString(root.summary, {
			prefix: "Total: ",
		});
		if (totalSummary) {
			output += `

${totalSummary}`;
		}

		output += `

${this._getIcon(ComponentType.Server)}: Server Component
${this._getIcon(ComponentType.Client)}: Client Component`;

		return output;
	}

	private _findCommonBasePath(filePaths: string[]): string {
		if (filePaths.length === 0) return ".";
		const A = filePaths.map((p) => p.split(path.sep));
		let i = 0;
		while (
			i < A[0].length &&
			A.every((B) => B.length > i && B[i] === A[0][i])
		) {
			i++;
		}
		return A[0].slice(0, i).join(path.sep);
	}

	private _buildTree(): TreeNode {
		const root: TreeNode = {
			name: this.projectPath,
			children: new Map(),
			summary: new Map(),
		};

		const componentList = [...this.components.values()];
		const _relativePaths = componentList.map((c) =>
			path.relative(this.projectPath, c.filePath),
		);

		for (const component of this.components.values()) {
			const relativePath = path.relative(this.projectPath, component.filePath);
			const pathParts = relativePath.split(path.sep);

			let currentNode = root;
			for (let i = 0; i < pathParts.length; i++) {
				const part = pathParts[i];
				if (!currentNode.children.has(part)) {
					currentNode.children.set(part, {
						name: part,
						children: new Map(),
						summary: new Map(),
					});
				}
				const nextNode = currentNode.children.get(part);
				if (!nextNode) {
					// This should not happen based on the logic above,
					// but it satisfies the linter and acts as a safeguard.
					throw new Error(
						`Unexpected error: nextNode is undefined for part '${part}'`,
					);
				}
				currentNode = nextNode;
				if (i === pathParts.length - 1) {
					currentNode.component = component;
				}
			}
		}

		this._calculateSummary(root);
		return root;
	}

	private _calculateSummary(node: TreeNode): void {
		if (node.component) {
			node.summary.set(node.component.type, 1);
			return;
		}

		for (const child of node.children.values()) {
			this._calculateSummary(child);
			for (const [type, count] of child.summary.entries()) {
				node.summary.set(type, (node.summary.get(type) ?? 0) + count);
			}
		}
	}

	private _formatSummaryString(
		summary: Map<ComponentType, number>,
		options: { prefix?: string; useParens?: boolean } = {},
	): string {
		const { prefix = "", useParens = false } = options;
		const parts: string[] = [];
		const sortedSummary = [...summary.entries()].sort(([a], [b]) =>
			a.localeCompare(b),
		);

		for (const [type, count] of sortedSummary) {
			if (count > 0) {
				parts.push(`${this._getIcon(type)} ${count}`);
			}
		}

		if (parts.length === 0) {
			return "";
		}

		const content = parts.join(", ");
		if (useParens) {
			return ` (${content})`;
		}
		return `${prefix}${content}`;
	}

	private _shouldDisplay(node: TreeNode): boolean {
		if (node.component) {
			const { filePath } = node.component;
			return filePath.endsWith(".tsx") || filePath.endsWith(".jsx");
		}

		if (node.children.size > 0) {
			return Array.from(node.children.values()).some((child) =>
				this._shouldDisplay(child),
			);
		}

		return false;
	}

	private _formatTreeNodes(node: TreeNode, prefix = ""): string {
		let output = "";
		const children = Array.from(node.children.values()).filter((child) =>
			this._shouldDisplay(child),
		);
		children.sort((a, b) => a.name.localeCompare(b.name)); // Sort for consistent output

		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const isLast = i === children.length - 1;
			const connector = isLast ? "└──" : "├──";
			const newPrefix = prefix + (isLast ? "   " : "│  ");

			const icon = child.component ? this._getIcon(child.component.type) : "📁";
			const summary = child.component
				? ""
				: this._formatSummaryString(child.summary, { useParens: true });
			const label = child.component
				? `${icon} ${child.name}`
				: `📁 ${child.name}${summary}`;

			output += `
${prefix}${connector} ${label}`;

			if (child.children.size > 0) {
				output += this._formatTreeNodes(child, newPrefix);
			}
		}
		return output;
	}

	private _getIcon(type: ComponentType): string {
		const iconMap = new Map<ComponentType, string>([
			[ComponentType.Server, "🟢"],
			[ComponentType.Client, "🔴"],
		]);

		return iconMap.get(type) ?? "⚪️";
	}
}
