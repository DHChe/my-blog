import React from "react";

export const Hero = () => {
    return (
        <section id="hero" className="flex flex-col justify-center min-h-screen p-0">
            <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                <h1 className="font-mono text-green text-base mb-5 ml-1 font-normal">
                    안녕하세요, 제 이름은
                </h1>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <h2 className="big-heading text-lightest-slate">
                    Brittany Chiang입니다.
                </h2>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <h3 className="big-heading text-slate mt-1">
                    웹을 위한 가치를 만듭니다.
                </h3>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                <p className="mt-5 max-w-[540px] text-lg leading-relaxed text-slate">
                    저는 탁월한 디지털 경험을 구축(하고 종종 디자인)하는 데 특화된 소프트웨어 엔지니어입니다. 현재는 Upstatement에서 접근성 높고 사람 중심적인 제품을 만드는 데 집중하고 있습니다.
                </p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
                <a
                    href="/#project"
                    className="inline-block px-7 py-4 mt-12 font-mono text-green border border-green rounded hover:bg-green-tint transition-all"
                >
                    제 프로젝트를 확인해보세요!
                </a>
            </div>
        </section>
    );
};
