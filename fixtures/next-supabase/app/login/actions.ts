"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "../../src/server/session";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const client = await createSessionClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  // Same message for unknown user and bad password.
  if (error) redirect("/login?error=1");
  redirect("/imports");
}

export async function signOut() {
  const client = await createSessionClient();
  await client.auth.signOut();
  redirect("/login");
}
