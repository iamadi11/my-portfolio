import React, { Children, isValidElement } from 'react';

import clsx from 'clsx';

type Props = {
    children: React.ReactNode;
    className?: string;
};

const Header = ({ children, className }: Props) => (
    <header className={clsx('col-span-2', className)}>{children}</header>
);

const Main = ({ children, className }: Props) => (
    <main className={clsx('overflow-y-auto', className)}>{children}</main>
);

const Sidebar = ({ children, className }: Props) => <aside className={clsx(className)}>{children}</aside>;

const Footer = ({ children, className }: Props) => (
    <footer className={clsx('col-span-2', className)}>{children}</footer>
);

interface LayoutComponent extends React.FC<Props> {
    Header: typeof Header;
    Main: typeof Main;
    Sidebar: typeof Sidebar;
    Footer: typeof Footer;
}

const Layout: LayoutComponent = ({ children, className }: Props) => {
    const hasVisibleSidebar = Children.toArray(children).some(
        (child) =>
            isValidElement<Props>(child) &&
            child.type === Layout.Sidebar &&
            !child.props.className?.includes('hidden')
    );

    return (
        <div
            className={clsx(
                'grid h-screen grid-rows-[auto_1fr_auto]',
                hasVisibleSidebar ? 'grid-cols-[250px_1fr]' : 'grid-cols-[1fr]',
                className
            )}
        >
            {children}
        </div>
    );
};

Layout.Header = Header;
Layout.Main = Main;
Layout.Sidebar = Sidebar;
Layout.Footer = Footer;

export default Layout;
