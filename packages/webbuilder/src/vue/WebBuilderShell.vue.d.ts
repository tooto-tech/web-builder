import type { StyleValue } from 'vue';
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<import("vue").ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<{
    registrationDiagnosticText?: string | undefined;
    editorReady: boolean;
    isPageSwitching?: boolean | undefined;
    isPreviewMode?: boolean | undefined;
    isActivePanelFullWidth?: boolean | undefined;
    sidePanelGridStyle?: StyleValue;
    isResizingSidePanel?: boolean | undefined;
    isBottomDropActive?: boolean | undefined;
    editorLoadingVisible?: boolean | undefined;
    blockingProcessingActive?: boolean | undefined;
    editorLoadingText?: string | undefined;
}>, {
    registrationDiagnosticText: string;
    isPageSwitching: boolean;
    isPreviewMode: boolean;
    isActivePanelFullWidth: boolean;
    sidePanelGridStyle: undefined;
    isResizingSidePanel: boolean;
    isBottomDropActive: boolean;
    editorLoadingVisible: boolean;
    blockingProcessingActive: boolean;
    editorLoadingText: string;
}>>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    "exit-preview": () => void;
    "bottom-drop-drag-enter": (value: DragEvent) => void;
    "bottom-drop-drag-leave": (value: DragEvent) => void;
    "bottom-drop-drag-over": (value: DragEvent) => void;
    "bottom-drop": (value: DragEvent) => void;
    "start-side-panel-resize": (value: MouseEvent) => void;
    "side-panel-resize-move": (value: MouseEvent) => void;
    "stop-side-panel-resize": (value: MouseEvent) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<{
    registrationDiagnosticText?: string | undefined;
    editorReady: boolean;
    isPageSwitching?: boolean | undefined;
    isPreviewMode?: boolean | undefined;
    isActivePanelFullWidth?: boolean | undefined;
    sidePanelGridStyle?: StyleValue;
    isResizingSidePanel?: boolean | undefined;
    isBottomDropActive?: boolean | undefined;
    editorLoadingVisible?: boolean | undefined;
    blockingProcessingActive?: boolean | undefined;
    editorLoadingText?: string | undefined;
}>, {
    registrationDiagnosticText: string;
    isPageSwitching: boolean;
    isPreviewMode: boolean;
    isActivePanelFullWidth: boolean;
    sidePanelGridStyle: undefined;
    isResizingSidePanel: boolean;
    isBottomDropActive: boolean;
    editorLoadingVisible: boolean;
    blockingProcessingActive: boolean;
    editorLoadingText: string;
}>>> & Readonly<{
    "onExit-preview"?: (() => any) | undefined;
    "onBottom-drop-drag-enter"?: ((value: DragEvent) => any) | undefined;
    "onBottom-drop-drag-leave"?: ((value: DragEvent) => any) | undefined;
    "onBottom-drop-drag-over"?: ((value: DragEvent) => any) | undefined;
    "onBottom-drop"?: ((value: DragEvent) => any) | undefined;
    "onStart-side-panel-resize"?: ((value: MouseEvent) => any) | undefined;
    "onSide-panel-resize-move"?: ((value: MouseEvent) => any) | undefined;
    "onStop-side-panel-resize"?: ((value: MouseEvent) => any) | undefined;
}>, {
    registrationDiagnosticText: string;
    isPageSwitching: boolean;
    isPreviewMode: boolean;
    isActivePanelFullWidth: boolean;
    sidePanelGridStyle: string | false | import("vue").CSSProperties | StyleValue[] | null;
    isResizingSidePanel: boolean;
    isBottomDropActive: boolean;
    editorLoadingVisible: boolean;
    blockingProcessingActive: boolean;
    editorLoadingText: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>, {
    "top-bar"?(_: {}): any;
    rail?(_: {}): any;
    "side-panel"?(_: {}): any;
    "full-panel"?(_: {}): any;
    canvas?(_: {}): any;
    "floating-panels"?(_: {}): any;
    modals?(_: {}): any;
}>;
export default _default;
type __VLS_NonUndefinedable<T> = T extends undefined ? never : T;
type __VLS_TypePropsToRuntimeProps<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? {
        type: import('vue').PropType<__VLS_NonUndefinedable<T[K]>>;
    } : {
        type: import('vue').PropType<T[K]>;
        required: true;
    };
};
type __VLS_WithDefaults<P, D> = {
    [K in keyof Pick<P, keyof P>]: K extends keyof D ? __VLS_Prettify<P[K] & {
        default: D[K];
    }> : P[K];
};
type __VLS_Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
