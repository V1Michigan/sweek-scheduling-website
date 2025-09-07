import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createHash } from "crypto";
import CompanyCard from "@/components/CompanyCard";

interface PageProps {
	params: Promise<{
		token: string;
	}>;
}

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
}

interface Match {
	company: Company;
}

async function getStudentByToken(token: string): Promise<Student | null> {
	const tokenHash = createHash("sha256").update(token).digest("hex");

	console.log("Looking up student with token:", token);
	console.log("Token hash:", tokenHash);

	const { data, error } = await supabase
		.from("sweek_students")
		.select("*")
		.eq("token_hash", tokenHash)
		.eq("is_active", true)
		.single();

	if (error) {
		console.error("Database error:", error);
		return null;
	}

	if (!data) {
		console.log("No student found with this token hash");
		return null;
	}

	console.log("Student found:", data.name, data.email);
	return data;
}

async function getStudentMatches(studentId: string): Promise<Match[]> {
	const { data, error } = await supabase
		.from("sweek_matches")
		.select(
			`
      tier,
      stage,
      sweek_companies!inner (
        id,
        name,
        blurb,
        looking_for,
        logo_slug,
        scheduling_url
      )
    `
		)
		.eq("student_id", studentId);

	if (error || !data) {
		return [];
	}

	return data.map((match: any) => ({
		company: {
			...match.sweek_companies,
			tier: match.tier,
			stage: match.stage,
		} as Company,
	}));
}

export default async function StudentPage({ params }: PageProps) {
	const { token } = await params;

	// Get student by token
	const student = await getStudentByToken(token);

	if (!student) {
		notFound();
	}

	// Get student matches
	const matches = await getStudentMatches(student.id);

	// Sort matches: Top 10 first, then others
	const sortedMatches = matches.sort((a, b) => {
		if (a.company.tier === "Top 10" && b.company.tier !== "Top 10") return -1;
		if (a.company.tier !== "Top 10" && b.company.tier === "Top 10") return 1;
		return 0;
	});

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Your Company Matches
					</h1>
					<p className="text-gray-600">
						Welcome back, {student.name}! Here are the companies that match your
						profile.
					</p>
				</div>

				{sortedMatches.length === 0 ? (
					<div className="text-center py-12">
						<div className="text-gray-500 text-lg">
							No company matches found at this time.
						</div>
						<p className="text-gray-400 mt-2">
							Check back later for new opportunities!
						</p>
					</div>
				) : (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{sortedMatches.map((match) => (
							<CompanyCard key={match.company.id} company={match.company} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
