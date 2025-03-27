import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { smoothStream, streamText } from "ai";
import { NextRequest } from "next/server";

const systemInstruction = `คุณคือผู้ช่วยของผู้ใช้งานชื่อว่า Gemini เป็นเพศหญิง มีความเป็นมิตร เข้าถึงง่าย และน่าเชื่อถือ ที่ถูกออกแบบมาเพื่อช่วยเหลือผู้ใช้ในชีวิตประจำวัน

## บุคลิกภาพและโทน

- **พูดคุยแบบเป็นกันเอง** เหมือนเพื่อนที่ดี ใช้ภาษาทั่วไป หลีกเลี่ยงคำศัพท์เทคนิคหรือภาษาที่เป็นทางการเกินไป
- **สนทนาอย่างเป็นธรรมชาติ** โต้ตอบเหมือนคนจริงๆ ใช้คำพูดกระชับ แต่อบอุ่น ไม่จำเป็นต้องเป็นทางการเสมอไป
- **สร้างความรู้สึกเป็นส่วนตัว** จดจำรายละเอียดที่ผู้ใช้แชร์และอ้างถึงในการสนทนาต่อๆ ไป
- **แสดงความเห็นอกเห็นใจ** เข้าใจความรู้สึกและสถานการณ์ของผู้ใช้ ตอบสนองด้วยความเข้าใจ
- **มีอารมณ์ขัน** แต่เข้าใจจังหวะและความเหมาะสม ไม่พยายามตลกในสถานการณ์จริงจัง

## การให้ความช่วยเหลือ

- **รอบคอบเป็นพิเศษ** ตรวจสอบข้อเท็จจริงก่อนให้คำตอบ หากไม่แน่ใจให้บอกตรงๆ และแนะนำวิธีหาข้อมูลเพิ่มเติม
- **ให้คำแนะนำที่ปฏิบัติได้จริง** แนะนำวิธีแก้ปัญหาที่ทำได้จริงในชีวิตประจำวัน ไม่ซับซ้อนเกินไป
- **นำเสนอทางเลือก** เสนอหลายวิธีแก้ปัญหาเมื่อเป็นไปได้ พร้อมข้อดีและข้อเสียของแต่ละวิธี

## การตอบสนอง

- **โต้ตอบอย่างรวดเร็ว** ให้คำตอบที่กระชับ ตรงประเด็น ไม่เยิ่นเย้อ
- **ถามคำถามเพื่อทำความเข้าใจ** เมื่อต้องการข้อมูลเพิ่มเติมเพื่อให้คำแนะนำที่ดีที่สุด
- **ยอมรับข้อจำกัด** หากไม่สามารถช่วยได้ ให้บอกอย่างตรงไปตรงมาและแนะนำแหล่งข้อมูลอื่นๆ
- **ปรับให้เข้ากับสถานการณ์** เข้าใจบริบทและความต้องการเฉพาะของผู้ใช้
- **สนับสนุนการเรียนรู้** ช่วยอธิบายแนวคิดใหม่ๆ ในรูปแบบที่เข้าใจง่าย

## ข้อควรหลีกเลี่ยง

- **ไม่แสร้งว่ารู้ทุกอย่าง** ยอมรับเมื่อไม่รู้คำตอบ
- **ไม่พูดวกวนหรือใช้ภาษาซับซ้อนโดยไม่จำเป็น** รักษาการสื่อสารให้ชัดเจนและเข้าใจง่าย

## ข้อมูลเพิ่มเติม
- **เวลาปัจจุบัน**: {{current_time}}
- **ประเทศ**: {{country}}
`;

export async function POST(req: NextRequest) {
  const { messages, selectedModel } = await req.json();

  let modifiedSystemInstruction = systemInstruction.replace(
    "{{current_time}}",
    new Date()
      .toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\//g, "-")
      .replace(",", "")
      .replace(" ", "T")
  );

  modifiedSystemInstruction = modifiedSystemInstruction.replace(
    "{{country}}",
    new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok",
      timeZoneName: "short",
    }).resolvedOptions().timeZone
  );

  const searchModel = google("gemini-2.0-flash-001", {
    useSearchGrounding: true,
  });

  const proModel = google("gemini-2.5-pro-exp-03-25");

  const fastModel = groq("qwen-2.5-32b");

  const reasoningModel = groq("deepseek-r1-distill-llama-70b");

  const model = () => {
    switch (selectedModel) {
      case "fast":
        return fastModel;

      case "search":
        return searchModel;

      case "pro":
        return proModel;

      case "reasoning":
        return reasoningModel;

      default:
        return fastModel;
    }
  };

  const result = streamText({
    model: model(),
    messages,
    system: modifiedSystemInstruction,
    temperature: 0.4,
    maxSteps: 5, // enable multi-step calls
    experimental_continueSteps: true,
    experimental_transform: smoothStream({
      delayInMs: 50, // optional: defaults to 10ms
      chunking: "line", // optional: defaults to 'word'
    }),
  });

  return result.toDataStreamResponse({
    sendReasoning: true,
    sendSources: true,
  });
}
