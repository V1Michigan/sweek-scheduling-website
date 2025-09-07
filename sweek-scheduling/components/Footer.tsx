import Link from "next/link";

export default function Footer() {
	return (
		<footer className="bg-white border-t border-gray-200 mt-16">
			<div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
				<div className="flex flex-col md:flex-row justify-between items-center gap-4">
					<div className="text-center md:text-left">
						<p className="text-sm font-inter text-[#444444]/70">
							© 2025 V1 @ Michigan | Startup Fair 2025
						</p>
					</div>

					<div className="flex items-center gap-6">
						<Link
							href="https://www.v1michigan.com/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm font-inter text-[#444444]/70 hover:text-[#444444] transition-colors"
						>
							V1 Michigan
						</Link>
						<Link
							href="https://startupweek.v1michigan.com/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-sm font-inter text-[#444444]/70 hover:text-[#444444] transition-colors"
						>
							Startup Week
						</Link>
						<Link
							href="mailto:team@v1michigan.com"
							className="text-sm font-inter text-[#444444]/70 hover:text-[#444444] transition-colors"
						>
							Contact
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
