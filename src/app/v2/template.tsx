/* Route-level template for /v2 — overrides the root template.tsx so the
   OS-desktop Header/Layout/Footer don't wrap the v2 portfolio. */
export default function V2Template({ children }: { children: React.ReactNode }): JSX.Element {
    return <>{children}</>;
}
