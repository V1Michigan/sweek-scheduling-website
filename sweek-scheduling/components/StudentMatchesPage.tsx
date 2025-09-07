"use client";

import { motion, AnimatePresence } from "framer-motion";
import CompanyCard from "@/components/CompanyCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Student {
	id: string;
	name: string;
	email: string;
	is_active: boolean;
}

interface Company {
	id: string;
	name: string;
	blurb: string;
	looking_for: string;
	logo_slug: string;
	tier: string;
	stage: string;
	scheduling_url: string;
	website_url?: string;
}

interface Match {
	company: Company;
}

interface StudentMatchesPageProps {
	student: Student;
	matches: Match[];
}

export default function StudentMatchesPage({
	student,
	matches,
}: StudentMatchesPageProps) {
	// Sort matches: Accepted first, then pending, then declined last
	const sortedMatches = matches.sort((a, b) => {
		// First priority: Declined cards go to the bottom
		if (a.company.stage === "rejected" && b.company.stage !== "rejected")
			return 1;
		if (a.company.stage !== "rejected" && b.company.stage === "rejected")
			return -1;

		// Second priority: Accepted cards (need_to_schedule, scheduled, completed) go to the top
		const aIsAccepted = ["need_to_schedule", "scheduled", "completed"].includes(
			a.company.stage
		);
		const bIsAccepted = ["need_to_schedule", "scheduled", "completed"].includes(
			b.company.stage
		);

		if (aIsAccepted && !bIsAccepted) return -1;
		if (!aIsAccepted && bIsAccepted) return 1;

		// Third priority: Among same stage, Top 10 first
		if (a.company.tier === "Top 10" && b.company.tier !== "Top 10") return -1;
		if (a.company.tier !== "Top 10" && b.company.tier === "Top 10") return 1;
		return 0;
	});

	return (
		<div className="min-h-screen bg-[#FAF7F2]">
			<Header />
			<div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
				<div className="text-center mb-16">
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.6 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
						className="mb-6 text-5xl sm:text-6xl md:text-7xl lg:text-[9rem] font-instrument font-normal text-[#444444] leading-tight"
					>
						Startup Week
					</motion.h1>
					<p className="font-inter font-normal text-base sm:text-lg md:text-xl text-[#444444] mb-8 max-w-3xl mx-auto leading-relaxed">
						Hey <span className="font-semibold">{student.name}</span>! 👋 These
						amazing companies want to chat with you. Swipe through and let us
						know who you're excited to meet! 🚀
					</p>

					{/* Instructions */}
					<p className="text-sm font-inter text-[#444444]/70 max-w-2xl mx-auto">
						💡 Don't stress - you can always change your mind later!
					</p>
				</div>

				{sortedMatches.length === 0 ? (
					<div className="text-center py-16">
						<div className="text-[#444] text-xl font-instrument font-light">
							No company matches found at this time.
						</div>
						<p className="text-[#444]/70 mt-3 font-inter">
							Check back later for new opportunities!
						</p>
					</div>
				) : (
					<motion.div
						className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8"
						layout
					>
						<AnimatePresence mode="popLayout">
							{sortedMatches.map((match, index) => (
								<motion.div
									key={`${match.company.id}-${match.company.stage}`}
									layout
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									transition={{
										duration: 0.4,
										ease: "easeOut",
										delay: index * 0.03,
									}}
								>
									<CompanyCard company={match.company} />
								</motion.div>
							))}
						</AnimatePresence>
					</motion.div>
				)}
			</div>
			<Footer />
		</div>
	);
}
