import React from "react";

export default function TILLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen bg-navy w-full">
            {children}
        </div>
    );
}

