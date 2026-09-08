import React from "react";
import { cn } from "@/lib/utils";

// Antes: max-w-lg fixo em qualquer tela, então em tablet/desktop o app ficava
// uma coluna estreita de ~512px sobrando espaço vazio nas laterais.
// Agora: continua mobile-first (largura cheia no celular), mas em telas
// maiores ganha mais respiro horizontal em vez de ficar "preso" no tamanho de celular.
export const MobileContainer = ({ children, className }) => {
  return (
    <div
      className={cn(
        "min-h-screen min-h-dvh w-full mx-auto",
        "max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
        "bg-background",
        "flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
};

export const MobileHeader = ({ children, className }) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "px-4 py-4 md:px-6",
        "bg-background/80 backdrop-blur-lg",
        "border-b border-border/50",
        "safe-area-top",
        className
      )}
    >
      {children}
    </header>
  );
};

export const MobileContent = ({ children, className }) => {
  return (
    <main
      className={cn(
        "flex-1 px-4 py-4 md:px-6",
        "overflow-y-auto",
        className
      )}
    >
      {children}
    </main>
  );
};

export const MobileFooter = ({ children, className }) => {
  return (
    <footer
      className={cn(
        "sticky bottom-0 z-40",
        "px-4 py-4 md:px-6",
        "bg-background/90 backdrop-blur-lg",
        "border-t border-border/50",
        "safe-area-bottom",
        className
      )}
    >
      {children}
    </footer>
  );
};
