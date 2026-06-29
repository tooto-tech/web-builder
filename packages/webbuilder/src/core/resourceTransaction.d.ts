export type ResourceFailurePolicy = 'blocking' | 'warning';
export type ResourceTransactionOperation = 'flushDraft' | 'publish' | 'releaseLock';
export type ResourceDirtyState = boolean | {
    value: boolean;
} | (() => boolean);
export interface ResourceOperationResult {
    success?: boolean;
    hasFailure?: boolean;
    hasConflict?: boolean;
    failedResources?: string[];
    message?: string;
}
export type ResourceOperationResponse = boolean | ResourceOperationResult | void;
export interface ResourceTransactionParticipant {
    id: string;
    label: string;
    isDirty: ResourceDirtyState;
    flushDraft: () => Promise<ResourceOperationResponse> | ResourceOperationResponse;
    publish: () => Promise<ResourceOperationResponse> | ResourceOperationResponse;
    releaseLock: () => Promise<void> | void;
    failurePolicy: ResourceFailurePolicy;
}
export interface ResourceTransactionDiagnostic {
    participantId: string;
    participantLabel: string;
    operation: ResourceTransactionOperation;
    message: string;
    hasConflict: boolean;
    failedResources: string[];
    error?: unknown;
}
export interface ResourceTransactionResult {
    success: boolean;
    failures: ResourceTransactionDiagnostic[];
    warnings: ResourceTransactionDiagnostic[];
}
export interface UseResourceTransactionOptions {
    participants: ResourceTransactionParticipant[] | (() => ResourceTransactionParticipant[]);
}
export declare function createResourceTransaction(options: UseResourceTransactionOptions): {
    getDirtyParticipants: () => ResourceTransactionParticipant[];
    hasDirtyResources: () => boolean;
    flushDrafts: () => Promise<ResourceTransactionResult>;
    publish: () => Promise<ResourceTransactionResult>;
    releaseLocks: () => Promise<ResourceTransactionResult>;
};
