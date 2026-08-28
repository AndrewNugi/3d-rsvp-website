import { NextResponse } from "next/server";
import { insertRsvp } from "@/lib/db";

const MAX_NAME_LENGTH = 200;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, attending } = (body ?? {}) as { name?: unknown; attending?: unknown };

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: "That name is too long." }, { status: 400 });
  }
  if (typeof attending !== "boolean") {
    return NextResponse.json({ error: "Please choose whether you're attending." }, { status: 400 });
  }

  try {
    await insertRsvp(name.trim(), attending);
  } catch (err) {
    console.error("Failed to save RSVP:", err);
    return NextResponse.json(
      { error: "Something went wrong saving your RSVP. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
