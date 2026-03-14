import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/gemini";
import { TEAM_SUMMARY_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const { team_data } = await req.json();

    const prompt = TEAM_SUMMARY_PROMPT.replace("{team_data}", JSON.stringify(team_data, null, 2));

    const result = await generateJSON<{
      insights: Array<{ type: "positive" | "negative" | "warning"; text: string }>;
    }>(prompt);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Team summary error:", error);
    return NextResponse.json(
      { error: "فشل في تلخيص الفريق" },
      { status: 500 }
    );
  }
}
