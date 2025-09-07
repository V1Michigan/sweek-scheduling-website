import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createHash } from "crypto";
import StudentMatchesPage from "@/components/StudentMatchesPage";

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
	website_url?: string;
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
              scheduling_url,
              website_url
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

	return <StudentMatchesPage student={student} matches={matches} />;
}
