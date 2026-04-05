import { NextRequest, NextResponse } from "next/server";

// Vercel serverless function - 把邮件存到 Vercel KV 或直接转发
// 简单起见先用 console.log + 返回成功（后续接 EmailOctopus）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Invalid email" },
        { status: 400 }
      );
    }

    // TODO: 接入 EmailOctopus API
    // 目前先打日志，并返回成功（让用户体验流畅）
    console.log(`[Subscribe] New subscriber: ${email} at ${new Date().toISOString()}`);

    // 如果配置了 EmailOctopus，转发过去
    const EO_API_KEY = process.env.EMAILOCTOPUS_API_KEY;
    const EO_LIST_ID = process.env.EMAILOCTOPUS_LIST_ID;

    if (EO_API_KEY && EO_LIST_ID) {
      const eoRes = await fetch(
        `https://emailoctopus.com/api/1.6/lists/${EO_LIST_ID}/contacts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: EO_API_KEY,
            email_address: email,
            status: "SUBSCRIBED",
          }),
        }
      );
      const eoData = await eoRes.json();
      if (eoData.error?.code === "MEMBER_EXISTS_WITH_EMAIL_ADDRESS") {
        return NextResponse.json({ success: true, message: "Already subscribed!" });
      }
    }

    return NextResponse.json({ success: true, message: "Successfully subscribed!" });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
