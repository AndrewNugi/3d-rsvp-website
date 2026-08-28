"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { deleteRsvp } from "@/lib/db";
import { HOST_SESSION_COOKIE, verifySessionToken } from "@/lib/hostAuth";

// Re-verifies the host session cookie independently — never trusts that the
// page already checked, since Server Actions are a reachable POST endpoint
// on their own (same guard as /api/host/pdf).
export async function deleteRsvpAction(id: number): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(HOST_SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    throw new Error("Access denied.");
  }

  await deleteRsvp(id);
  revalidatePath("/host");
}
