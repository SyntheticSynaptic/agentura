import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string };
    const email = payload.email?.trim().toLowerCase();

    if (!email || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
    }

    console.log("[waitlist] new signup:", email);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }
}
