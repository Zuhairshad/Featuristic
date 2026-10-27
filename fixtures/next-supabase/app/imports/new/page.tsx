import { redirect } from "next/navigation";
import { ImportWizard } from "../../../src/components/import-wizard";
import { getSessionState } from "../../../src/server/session";

export const dynamic = "force-dynamic";

export default async function NewImportPage() {
  const state = await getSessionState();
  if (state.kind === "anonymous") redirect("/login");
  if (state.kind === "not-admin") redirect("/imports");
  return (
    <main>
      <h1>New import · {state.tenantName}</h1>
      <ImportWizard tenantId={state.tenantId} />
    </main>
  );
}
