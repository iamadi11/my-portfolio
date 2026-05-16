// React 19 removed the global JSX namespace — re-export it so existing
// JSX.Element return types across the codebase continue to compile.
import type React from 'react';

declare global {
    namespace JSX {
        type Element = React.JSX.Element;
        type ElementClass = React.JSX.ElementClass;
        type IntrinsicElements = React.JSX.IntrinsicElements;
    }
}
