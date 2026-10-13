import { db, ordersTable } from "@workspace/db";
import { and, asc, eq, lt } from "drizzle-orm";
import { FULFILLING, runFulfillment } from "./fulfillment.js";

const SWEEP_INTERVAL_MS = 60_000;
const BATCH_SIZE = 20;

/** 1, 2, 4, 8, 16, 32 minutes, then the order is left for an operator. */
const MAX_ATTEMPTS = 6;
const BASE_BACKOFF_MS = 60_000;

/**
 * A claim this old belonged to a process that died mid-flight. Generous on
 * purpose: reclaiming an order whose Airalo call is still in flight would buy
 * a second SIM, and no legitimate fulfillment takes anywhere near this long.
 */
const STALE_CLAIM_MS = 15 * 60_000;

interface Attempt {
  count: number;
  nextAt: number;
}

/**
 * Attempt counters live in memory, not in the orders table, so this needed no
 * migration. A restart clears them, which is the behaviour we want: a deploy
 * is exactly when a batch of orders deserves another try.
 */
const attempts = new Map<number, Attempt>();

function backoffMs(count: number): number {
  return BASE_BACKOFF_MS * 2 ** (count - 1);
}

function recordFailure(orderId: number): Attempt {
  const prev = attempts.get(orderId);
  const count = (prev?.count ?? 0) + 1;
  const next: Attempt = { count, nextAt: Date.now() + backoffMs(count) };
  attempts.set(orderId, next);
  return next;
}

/**
 * Return orders whose claim outlived the process that took it, so the next
 * pass can pick them up.
 */
async function reclaimStaleClaims(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_CLAIM_MS);
  const stale = await db.update(ordersTable)
    .set({ status: "paid", updatedAt: new Date() })
    .where(and(eq(ordersTable.status, FULFILLING), lt(ordersTable.updatedAt, cutoff)))
    .returning({ id: ordersTable.id });

  for (const order of stale) {
    // Worth investigating by hand: if the process died between Airalo issuing
    // the SIM and the row being written, retrying buys a second one.
    console.warn(`[Sweeper] Reclaimed order #${order.id} from a stale ${FULFILLING} claim — verify no eSIM was issued`);
  }
}

async function sweepOnce(): Promise<void> {
  await reclaimStaleClaims();

  const pending = await db.select()
    .from(ordersTable)
    .where(eq(ordersTable.status, "paid"))
    .orderBy(asc(ordersTable.createdAt))
    .limit(BATCH_SIZE);

  for (const order of pending) {
    const state = attempts.get(order.id);
    if (state) {
      if (state.count >= MAX_ATTEMPTS) continue;
      if (Date.now() < state.nextAt) continue;
    }

    try {
      const result = await runFulfillment(order);
      if (result === null) continue; // someone else claimed it first
      attempts.delete(order.id);
      console.log(`[Sweeper] Recovered order #${order.id}${result.topup ? " (topup)" : ""}`);
    } catch (err) {
      const next = recordFailure(order.id);
      if (next.count >= MAX_ATTEMPTS) {
        console.error(
          `[Sweeper] Order #${order.id} failed ${next.count} times — giving up, needs an operator. Last error:`,
          err,
        );
      } else {
        console.warn(
          `[Sweeper] Order #${order.id} attempt ${next.count} failed, retrying in ${Math.round(backoffMs(next.count) / 1000)}s:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }
}

/**
 * Retries orders whose eSIM never arrived.
 *
 * Payment and fulfillment cannot be one transaction — the money moves at QPay
 * and the SIM comes from Airalo — so an order can sit paid with nothing to
 * show for it whenever Airalo is unreachable. Before this, that state was
 * terminal until someone noticed it in the admin panel.
 *
 * Driven off the orders table rather than an in-process queue, so a deploy or
 * a crash mid-fulfillment does not lose the work.
 */
export function startFulfillmentSweeper(): void {
  const run = () => {
    sweepOnce().catch((err) => console.error("[Sweeper] Sweep failed:", err));
  };

  setInterval(run, SWEEP_INTERVAL_MS);
  // Recover anything left behind by the process this one replaced.
  run();

  console.log(`[Sweeper] Fulfillment retry sweeper started (every ${SWEEP_INTERVAL_MS / 1000}s)`);
}
