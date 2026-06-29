declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<import("vue").ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<{
    title?: string | undefined;
    width?: number | undefined;
    initialY?: number | undefined;
    right?: number | undefined;
    zIndex?: number | undefined;
    panelClass?: string | undefined;
    bodyClass?: string | undefined;
}>, {
    title: string;
    width: number;
    initialY: number;
    right: number;
    zIndex: number;
    panelClass: string;
    bodyClass: string;
}>>, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    close: () => void;
    "position-change": (position: {
        x: number;
        y: number;
    }) => void;
    "drag-start": (position: {
        x: number;
        y: number;
    }) => void;
    "drag-end": (position: {
        x: number;
        y: number;
    }) => void;
    "body-drag-leave": (event: DragEvent) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<{
    title?: string | undefined;
    width?: number | undefined;
    initialY?: number | undefined;
    right?: number | undefined;
    zIndex?: number | undefined;
    panelClass?: string | undefined;
    bodyClass?: string | undefined;
}>, {
    title: string;
    width: number;
    initialY: number;
    right: number;
    zIndex: number;
    panelClass: string;
    bodyClass: string;
}>>> & Readonly<{
    onClose?: (() => any) | undefined;
    "onPosition-change"?: ((position: {
        x: number;
        y: number;
    }) => any) | undefined;
    "onDrag-start"?: ((position: {
        x: number;
        y: number;
    }) => any) | undefined;
    "onDrag-end"?: ((position: {
        x: number;
        y: number;
    }) => any) | undefined;
    "onBody-drag-leave"?: ((event: DragEvent) => any) | undefined;
}>, {
    title: string;
    width: number;
    right: number;
    initialY: number;
    zIndex: number;
    panelClass: string;
    bodyClass: string;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>, {
    "header-start"?(_: {}): any;
    title?(_: {}): any;
    "header-end"?(_: {}): any;
    default?(_: {}): any;
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
