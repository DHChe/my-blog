"use client";

import { usePathname } from "next/navigation";
import { LeftColumn } from "./LeftColumn";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isTILPage = pathname?.startsWith("/til");
    const isAdminPage = pathname?.startsWith("/admin");

    if (isTILPage || isAdminPage) {
        return <>{children}</>;
    }

    return (
        <div className="mx-auto min-h-screen max-w-screen-xl px-6 py-12 md:px-12 md:py-20 lg:px-24 lg:py-0 lg:flex lg:justify-between lg:gap-4">
            <LeftColumn />
            <main id="content" className="pt-24 lg:w-1/2 lg:py-24">
                {children}
            </main>
        </div>
    );
}

