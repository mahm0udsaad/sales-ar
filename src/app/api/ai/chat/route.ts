import { NextRequest } from "next/server";
import { getGeminiModel } from "@/lib/ai/gemini";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const { message, context, history } = await req.json();

    const model = getGeminiModel();

    const fullPrompt = `${CHAT_SYSTEM_PROMPT}

## بيانات الشركة الحالية:
${context || "لا توجد بيانات محملة حالياً"}

## المحادثة السابقة:
${(history || []).map((m: { role: string; content: string }) => `${m.role === "user" ? "المستخدم" : "المحلل"}: ${m.content}`).join("\n")}

## السؤال الحالي:
${message}

أجب بالعربية السعودية المهنية. في نهاية إجابتك، اقترح 2-3 أسئلة متابعة بعد سطر "---" بالشكل:
سؤال: النص`;

    const result = await model.generateContentStream(fullPrompt);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: "فشل في الاتصال بالمحلل الذكي" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
