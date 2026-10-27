import { createSupabaseWorkerStore } from "../import-center/worker-supabase";
import { runWorker } from "../import-center/worker";
import { createServiceClient } from "./service-client";

export const MAX_MESSAGES_PER_RUN = 20;

/** One bounded worker invocation used by the operator-authenticated internal endpoint.
 * It reads the global queue with a service-role client, so it must never be reachable from a user session. */
export async function runImportWorkerOnce(maxMessages = 1) {
  const bounded = Math.max(1, Math.min(Math.floor(maxMessages), MAX_MESSAGES_PER_RUN));
  const outcomes = await runWorker(
    { store: createSupabaseWorkerStore(createServiceClient()), now: () => new Date() },
    bounded,
  );
  // Report kinds only; outcomes may reference imports from other tenants.
  return outcomes.map((outcome) => outcome.kind);
}
