declare const _default: import("vue").DefineComponent<import("vue").ExtractPropTypes<__VLS_TypePropsToRuntimeProps<{
    showLayers: boolean;
    showCode: boolean;
    showBorders: boolean;
    showDevActions?: boolean | undefined;
    isPublishing?: boolean | undefined;
    devices: any[];
    selectedDevice: any;
    isTemplateResource?: boolean | undefined;
}>>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    publish: () => void;
    back: () => void;
    "open-page-settings": () => void;
    "toggle-borders": () => void;
    "toggle-layers": () => void;
    "toggle-code": () => void;
    preview: () => void;
    "save-draft": () => void;
    "export-project": () => void;
    "import-project": () => void;
    "reset-editor": () => void;
    "set-device": (device: any) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<__VLS_TypePropsToRuntimeProps<{
    showLayers: boolean;
    showCode: boolean;
    showBorders: boolean;
    showDevActions?: boolean | undefined;
    isPublishing?: boolean | undefined;
    devices: any[];
    selectedDevice: any;
    isTemplateResource?: boolean | undefined;
}>>> & Readonly<{
    onPublish?: (() => any) | undefined;
    onBack?: (() => any) | undefined;
    "onOpen-page-settings"?: (() => any) | undefined;
    "onToggle-borders"?: (() => any) | undefined;
    "onToggle-layers"?: (() => any) | undefined;
    "onToggle-code"?: (() => any) | undefined;
    onPreview?: (() => any) | undefined;
    "onSave-draft"?: (() => any) | undefined;
    "onExport-project"?: (() => any) | undefined;
    "onImport-project"?: (() => any) | undefined;
    "onReset-editor"?: (() => any) | undefined;
    "onSet-device"?: ((device: any) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
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
