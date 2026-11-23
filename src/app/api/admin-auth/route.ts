import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const candidate = typeof body?.pin === "string" ? body.pin.trim() : "";
    const expected = (process.env.ADMIN_PIN || "01487654").trim();

    if (!candidate || !expected) {
      return NextResponse.json({ authorized: false }, { status: 401 });
    }

    const candidateBuf = Buffer.from(candidate);
    const expectedBuf = Buffer.from(expected);

    const isMatch =
      candidateBuf.length === expectedBuf.length &&
      timingSafeEqual(candidateBuf, expectedBuf);

    if (!isMatch) {
      return NextResponse.json({ authorized: false }, { status: 401 });
    }

    return NextResponse.json({ authorized: true });
  } catch {
    return NextResponse.json({ authorized: false }, { status: 500 });
  }
}
