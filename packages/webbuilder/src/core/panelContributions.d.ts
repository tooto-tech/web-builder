import type { WebBuilderFeaturePlugin, WebBuilderPanelContribution } from './featurePlugin.js';
export declare const collectWebBuilderPanelContributions: (plugins: WebBuilderFeaturePlugin[]) => WebBuilderPanelContribution[];
export declare const findWebBuilderPanelContribution: (panels: WebBuilderPanelContribution[], panelId: string) => WebBuilderPanelContribution | null;
