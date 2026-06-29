import type { WebBuilderFeaturePlugin, WebBuilderPreviewContribution } from './featurePlugin.js';
export interface WebBuilderActivePreviewContribution {
    pluginId: string;
    preview: WebBuilderPreviewContribution;
}
export declare const collectWebBuilderPreviewContributions: (plugins: WebBuilderFeaturePlugin[]) => WebBuilderActivePreviewContribution[];
export declare const hasWebBuilderPreviewContribution: (contributions: WebBuilderActivePreviewContribution[]) => boolean;
export declare const canLoadWebBuilderPreviewContribution: (contributions: WebBuilderActivePreviewContribution[]) => boolean;
export declare const getWebBuilderPreviewProjectData: (contributions: WebBuilderActivePreviewContribution[]) => Record<string, unknown> | null;
export declare const restoreWebBuilderPreviewContributions: (contributions: WebBuilderActivePreviewContribution[]) => Promise<void>;
