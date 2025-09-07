import type { Metadata } from "next";
import { Inter, Playfair_Display, Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
});

const playfair = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-serif",
});

const instrumentSerif = Instrument_Serif({
	subsets: ["latin"],
	variable: "--font-instrument",
	weight: ["400"],
});

export const metadata: Metadata = {
	title: "Startup Fair 2025 - Company Matches",
	description:
		"Your personalized company matches for Startup Fair 2025 by V1 @ Michigan",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased",
					inter.variable,
					playfair.variable,
					instrumentSerif.variable
				)}
			>
				{children}
			</body>
		</html>
	);
}
