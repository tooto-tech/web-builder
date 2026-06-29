import type { ResourceTransactionParticipant } from './resourceTransaction.js';
import type { WebBuilderFeaturePlugin, WebBuilderPluginContext } from './featurePlugin.js';
export declare const collectWebBuilderResourceParticipants: (plugins: WebBuilderFeaturePlugin[], context: WebBuilderPluginContext) => ResourceTransactionParticipant[];
