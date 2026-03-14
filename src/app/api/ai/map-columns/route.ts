import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/gemini";
import { COLUMN_MAPPING_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const { sheets } = await req.json();

    const prompt = `${COLUMN_MAPPING_PROMPT}

## البيانات المرسلة:
${JSON.stringify(sheets, null, 2)}`;

    const result = await generateJSON<{
      sheets: Array<{
        name: string;
        type: string;
        confidence: number;
        mappings: Record<string, { column: number; header: string }>;
        detected_employees: string[];
        unmapped_columns: string[];
        stage_mapping: Record<string, string>;
      }>;
    }>(prompt);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Column mapping error:", error);
    return NextResponse.json(
      { error: "فشل في تحليل الأعمدة" },
      { status: 500 }
    );
  }
}
