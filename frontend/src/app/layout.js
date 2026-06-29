import "./globals.css";
import NavbarWrapper from "@/components/sections/NavbarWrapper";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Grapholyze",
  description: "AI Handwriting Personality Analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <NavbarWrapper />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}