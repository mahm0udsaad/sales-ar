import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/gemini";
import { EMPLOYEE_ANALYSIS_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const { employee_data } = await req.json();

    const prompt = EMPLOYEE_ANALYSIS_PROMPT.replace("{employee_data}", JSON.stringify(employee_data, null, 2));

    const result = await generateJSON<{
      summary: string;
      strengths: Array<{ point: string; metric: string; value: string }>;
      improvements: Array<{ point: string; metric: string; value: string; target: string }>;
      tip: string;
      forecast: string;
      comparison: { vs_team_avg: number; vs_last_month: number; rank: number; total_reps: number };
    }>(prompt);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "فشل في تحليل الأداء" },
      { status: 500 }
    );
  }
}
