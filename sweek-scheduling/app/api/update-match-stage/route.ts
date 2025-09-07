import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const { token, companyId, stage } = await request.json();

    if (!token || !companyId || !stage) {
      return NextResponse.json(
        { error: 'Missing required fields: token, companyId, stage' },
        { status: 400 }
      );
    }

    // Validate stage
    const validStages = ['pending', 'accepted', 'rejected', 'assigned', 'need_to_schedule', 'scheduled', 'completed', 'declined', 'canceled', 'no_show'];
    if (!validStages.includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid stage value' },
        { status: 400 }
      );
    }

    // Hash the token to find the student
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Get the student
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: student, error: studentError } = await supabase
      .from("sweek_students")
      .select("id")
      .eq("token_hash", tokenHash)
      .eq("is_active", true)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found or inactive' },
        { status: 404 }
      );
    }

    // Update the match stage using a direct SQL query to bypass RLS
    const { data, error } = await supabase.rpc('update_match_stage', {
      p_student_id: student.id,
      p_company_id: companyId,
      p_stage: stage
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update match stage' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: { stage: data.stage } 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
