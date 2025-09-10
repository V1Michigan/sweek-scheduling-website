"use client";

import Link from "next/link";

export default function Header() {
	return (
		<nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#FAF7F2]">
			<div className="flex items-center gap-4">
				<Link
					href="https://www.v1michigan.com/"
					className="font-medium"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img
						src="/v1-logo.png"
						alt="V1 Logo"
						width={32}
						height={32}
						className="h-8 w-auto"
					/>
				</Link>
				<div className="hidden md:block h-6 w-px bg-gray-300"></div>
				<div className="hidden md:block">
					<h1 className="text-lg font-instrument font-medium text-[#444]">
						Company Matches
					</h1>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<Link
					href="https://startupweek.v1michigan.com/"
					target="_blank"
					rel="noopener noreferrer"
					className="group flex items-center gap-2 text-sm font-inter text-[#444]/70 hover:text-[#444] transition-all duration-200 hover:scale-105"
				>
					<span>Startup Week 2025</span>
					<svg
						className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform duration-200"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
				</Link>
			</div>
		</nav>
	);
}
