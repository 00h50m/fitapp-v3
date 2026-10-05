import { ThemeProvider as NextThemesProvider } from "next-themes";

export const ThemeProvider = ({ children, ...props }) => {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" storageKey="fitapp-theme" {...props}>
      {children}
    </NextThemesProvider>
  );
};
