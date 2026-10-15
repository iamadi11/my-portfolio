/** Minimal types for the LAM Gaussian-splat avatar renderer (ships untyped). */
declare module 'gaussian-splat-renderer-for-lam' {
    export type ChatState = 'Idle' | 'Listening' | 'Thinking' | 'Responding';
    export class GaussianSplatRenderer {
        static getInstance(
            container: HTMLDivElement,
            assetPath: string,
            options?: {
                getChatState?: () => ChatState;
                getExpressionData?: () => Record<string, number>;
                downloadProgress?: (progress: number) => void;
                loadProgress?: (progress: number) => void;
                backgroundColor?: string;
                alpha?: number;
            }
        ): Promise<GaussianSplatRenderer | undefined>;
        dispose(): void;
    }
}
