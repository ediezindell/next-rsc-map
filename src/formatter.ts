import * as path from "node:path";
import chalk from "chalk";
import { ComponentType } from "./classifier";
import type { DependencyNode } from "./types";

interface TreeNode {
	name: string;
	component?: DependencyNode;
	children: Map<string, TreeNode>;
	summary: Map<ComponentType, number>;
}

export class OutputFormatter {
	private graph: Map<string, DependencyNode>;
	private projectPath: string;
	constructor(graph: Map<string, DependencyNode>, projectPath?: string) {
		if (!graph) {
			throw new Error("Graph map must be provided to OutputFormatter.");
		}
		this.graph = graph;
		this.projectPath =
			projectPath ?? this._findCommonBasePath([...graph.keys()]);
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

${this._getIcon(ComponentType.Client)}: Client Component
${this._getIcon(ComponentType.Server)}: Server Component`;

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

		for (const component of this.graph.values()) {
			const relativePath = path.relative(this.projectPath, component.path);
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
			const type = node.component.isClient
				? ComponentType.Client
				: ComponentType.Server;
			node.summary.set(type, 1);
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
			const { path: filePath } = node.component;
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

			const type = child.component?.isClient
				? ComponentType.Client
				: ComponentType.Server;
			const icon = child.component ? this._getIcon(type) : "📁";
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

	public formatWhyChain(chain: string[] | null, targetFile: string): string {
		if (!chain || chain.length === 0) {
			return `No dependency chain to a 'use client' boundary found for ${targetFile}`;
		}

		const relativeChain = chain.map((p) => path.relative(this.projectPath, p));
		const targetRelative = path.relative(this.projectPath, targetFile);

		let output = `Dependency trace for ${chalk.bold(
			targetRelative,
		)} to a 'use client' boundary:\n`;
		output += `Dependency chain:\n\n`;

		for (let i = 0; i < relativeChain.length; i++) {
			const file = relativeChain[i];
			const prefix = i === 0 ? "" : `${"  ".repeat(i)}└─▶ `;
			let line = `${prefix}${file}`;

			if (i === 0) {
				line += chalk.yellow('  (contains "use client")');
			}
			if (file === targetRelative) {
				line += chalk.cyan("  <- Target file");
			}
			output += `${line}\n`;
		}
		return output;
	}
}
