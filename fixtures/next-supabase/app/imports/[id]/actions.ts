"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ImportServiceError, replayImport } from "../../../src/import-center/service";
import { createSessionClient } from "../../../src/server/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function replayAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) redirect("/imports");
  let failed = false;
  try {
    // The database re-checks that the caller administers this import's tenant.
    await replayImport(await createSessionClient(), id);
  } catch (error) {
    if (!(error instanceof ImportServiceError)) throw error;
    failed = true;
  }
  revalidatePath(`/imports/${id}`);
  redirect(failed ? `/imports/${id}?replay=unavailable` : `/imports/${id}`);
}
