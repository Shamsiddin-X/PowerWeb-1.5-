import { Project, Page, CanvasElement } from '../../types';

export interface ASTNode {
    id: string;
    type: string;
    tag: string;
    className: string[];
    style: Record<string, any>;
    content?: string;
    children: ASTNode[];
    x: number;
    y: number;
    width: number;
    height: number;
    originalElement: CanvasElement;
}

export class SmartCodeGenerator {
    project: Project;

    constructor(project: Project) {
        this.project = project;
    }

    public generateReactTailwind(): string {
        const activePage = this.project.pages.find(p => p.id === this.project.activePageId);
        if (!activePage) return '// No active page selected';

        // 1. Flatten all elements from visible layers
        const elements: CanvasElement[] = [];
        activePage.layers.forEach(layer => {
            if (layer.visible) elements.push(...layer.elements);
        });

        if (elements.length === 0) return '// No elements found on the active page';

        // 2. Build multi-level AST
        const astRoots = this.buildAST(elements);

        // 3. Apply Flexbox heuristics
        this.applyFlexboxHeuristics(astRoots);

        // 4. Compile to React Code
        const componentName = activePage.name.replace(/[^a-zA-Z0-9]/g, '') || 'Page';
        return this.compileAST(astRoots, componentName, activePage.backgroundColor);
    }

    private buildAST(elements: CanvasElement[]): ASTNode[] {
        // Sort elements by area (largest to smallest) so containers are processed first
        const sorted = [...elements].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        
        const nodes: ASTNode[] = sorted.map(el => ({
            id: el.id,
            type: el.type,
            tag: this.determineTag(el),
            className: this.generateTailwindClasses(el),
            style: this.getRemainingStyles(el),
            content: el.content,
            children: [],
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            originalElement: el
        }));

        const roots: ASTNode[] = [];

        // Build hierarchy
        nodes.forEach(node => {
            let parent: ASTNode | null = null;
            
            // Find the tightest fitting parent (smallest area that encapsulates the node)
            for (let i = nodes.indexOf(node) - 1; i >= 0; i--) {
                const potentialParent = nodes[i];
                if (this.isInside(node, potentialParent)) {
                    if (!parent || (potentialParent.width * potentialParent.height < parent.width * parent.height)) {
                        parent = potentialParent;
                    }
                }
            }

            if (parent) {
                parent.children.push(node);
            } else {
                roots.push(node);
            }
        });

        this.sortChildrenVisually(roots);
        return roots;
    }

    private isInside(child: ASTNode, parent: ASTNode): boolean {
        // 5px tolerance for overlapping
        const t = 5;
        return (
            child.x >= parent.x - t &&
            child.y >= parent.y - t &&
            child.x + child.width <= parent.x + parent.width + t &&
            child.y + child.height <= parent.y + parent.height + t
        );
    }

    private sortChildrenVisually(nodes: ASTNode[]) {
        nodes.sort((a, b) => {
            // If they are on the same vertical line (within 10px), sort by X
            if (Math.abs(a.y - b.y) < 10) return a.x - b.x;
            return a.y - b.y; // Otherwise sort by Y
        });
        nodes.forEach(n => this.sortChildrenVisually(n.children));
    }

    private determineTag(el: CanvasElement): string {
        if (el.type === 'text') {
            if (el.style.fontSize && el.style.fontSize >= 32) return 'h1';
            if (el.style.fontSize && el.style.fontSize >= 24) return 'h2';
            if (el.style.fontSize && el.style.fontSize >= 20) return 'h3';
            return 'p';
        }
        if (el.type === 'button') return 'button';
        if (el.type === 'image') return 'img';
        
        // Semantic containers based on position
        if (el.y < 100 && el.width > 800) return 'header';
        if (el.y > 600 && el.width > 800) return 'footer';
        return 'div';
    }

    private generateTailwindClasses(el: CanvasElement): string[] {
        const classes: string[] = [];
        
        // Background
        if (el.style.fill && el.style.fill !== 'transparent' && !el.style.fill.startsWith('linear-gradient')) {
            classes.push(`bg-[${el.style.fill}]`);
        }
        
        // Typography
        if (el.type === 'text' || el.type === 'button') {
            if (el.style.color) classes.push(`text-[${el.style.color}]`);
            if (el.style.fontSize) classes.push(`text-[${el.style.fontSize}px]`);
            if (el.style.fontWeight === 'bold') classes.push('font-bold');
            if (el.style.fontStyle === 'italic') classes.push('italic');
            if (el.style.textAlign) classes.push(`text-${el.style.textAlign}`);
        }

        // Borders & Shadows
        if (el.style.strokeWidth && el.style.strokeWidth > 0 && el.style.stroke !== 'none') {
            classes.push(`border-[${el.style.strokeWidth}px]`);
            classes.push(`border-[${el.style.stroke}]`);
        }
        if (el.style.borderRadius) {
            classes.push(`rounded-[${el.style.borderRadius}px]`);
        }
        if (el.style.shadowBlur && el.style.shadowBlur > 0) {
            classes.push('shadow-lg'); // Simplification for now
        }

        // Glassmorphism
        if (el.style.backdropBlur && el.style.backdropBlur > 0) {
            classes.push(`backdrop-blur-[${el.style.backdropBlur}px]`);
            classes.push('bg-white/10');
        }

        // Interactivity
        if (el.type === 'button' || (el.logic && el.logic.length > 0)) {
            classes.push('cursor-pointer hover:opacity-80 transition-opacity');
        }

        return classes;
    }

    private getRemainingStyles(el: CanvasElement): Record<string, any> {
        const style: Record<string, any> = {};
        
        if (el.style.fill && el.style.fill.startsWith('linear-gradient')) {
            style.backgroundImage = el.style.fill;
        }

        // Fixed sizes for atomic elements, relative sizes for containers
        if (el.type === 'button' || el.type === 'image' || el.type === 'text') {
            style.width = `${el.width}px`;
            style.height = `${el.height}px`;
        } else {
            style.minHeight = `${el.height}px`;
            style.maxWidth = `${el.width}px`;
            style.width = '100%';
        }

        return style;
    }

    private applyFlexboxHeuristics(nodes: ASTNode[]) {
        for (const node of nodes) {
            if (node.children.length > 0) {
                node.className.push('flex');
                
                // Determine direction based on overlap
                let isRow = true;
                if (node.children.length > 1) {
                    const first = node.children[0];
                    const second = node.children[1];
                    // If vertical distance between centers is greater than horizontal distance
                    const dy = Math.abs((first.y + first.height/2) - (second.y + second.height/2));
                    const dx = Math.abs((first.x + first.width/2) - (second.x + second.width/2));
                    if (dy > dx) {
                        isRow = false;
                    }
                }
                
                if (isRow) {
                    node.className.push('flex-row', 'items-center');
                } else {
                    node.className.push('flex-col', 'items-start');
                }

                // Determine gap
                if (node.children.length > 1) {
                    let totalGap = 0;
                    let gapCount = 0;
                    for (let i = 0; i < node.children.length - 1; i++) {
                        const curr = node.children[i];
                        const next = node.children[i+1];
                        const gap = isRow 
                            ? (next.x - (curr.x + curr.width))
                            : (next.y - (curr.y + curr.height));
                        
                        if (gap > 0 && gap < 500) { // ignore unrealistic huge gaps
                            totalGap += gap;
                            gapCount++;
                        }
                    }
                    if (gapCount > 0) {
                        const avgGap = Math.round(totalGap / gapCount);
                        if (avgGap > 0) node.className.push(`gap-[${avgGap}px]`);
                    }
                }

                // Determine padding
                const minChildX = Math.min(...node.children.map(c => c.x));
                const minChildY = Math.min(...node.children.map(c => c.y));
                const maxChildR = Math.max(...node.children.map(c => c.x + c.width));
                const maxChildB = Math.max(...node.children.map(c => c.y + c.height));
                
                const pt = Math.round(Math.max(0, minChildY - node.y));
                const pl = Math.round(Math.max(0, minChildX - node.x));
                const pr = Math.round(Math.max(0, (node.x + node.width) - maxChildR));
                const pb = Math.round(Math.max(0, (node.y + node.height) - maxChildB));

                if (pt > 5) node.className.push(`pt-[${pt}px]`);
                if (pb > 5) node.className.push(`pb-[${pb}px]`);
                if (pl > 5) node.className.push(`pl-[${pl}px]`);
                if (pr > 5) node.className.push(`pr-[${pr}px]`);

                this.applyFlexboxHeuristics(node.children);
            }
        }
    }

    private compileAST(nodes: ASTNode[], componentName: string, pageBg: string): string {
        const renderNode = (node: ASTNode, indent: string): string => {
            const tag = node.tag;
            const cls = node.className.length > 0 ? ` className="${node.className.join(' ')}"` : '';
            
            let styleStr = '';
            if (Object.keys(node.style).length > 0) {
                const rules = Object.entries(node.style).map(([k, v]) => `${k}: '${v}'`).join(', ');
                styleStr = ` style={{ ${rules} }}`;
            }

            let content = '';
            if (node.tag === 'img') {
                const src = node.content || 'https://via.placeholder.com/150';
                return `${indent}<${tag} src="${src}" alt="Image"${cls}${styleStr} />`;
            } else if (node.children.length === 0) {
                content = node.content || '';
                return `${indent}<${tag}${cls}${styleStr}>${content}</${tag}>`;
            } else {
                const childrenStr = node.children.map(c => renderNode(c, indent + '  ')).join('\n');
                return `${indent}<${tag}${cls}${styleStr}>\n${childrenStr}\n${indent}</${tag}>`;
            }
        };

        const body = nodes.map(n => renderNode(n, '      ')).join('\n');

        return `import React from 'react';

// Auto-generated by PowerWeb Smart Code Generator V2
export default function ${componentName}() {
  return (
    <div className="w-full min-h-screen relative" style={{ backgroundColor: '${pageBg}' }}>
${body}
    </div>
  );
}
`;
    }
}
