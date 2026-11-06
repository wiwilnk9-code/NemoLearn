import { supabaseServer } from "@/lib/supabase/server";
import { isTestEnvironment } from "@/lib/db/supabase-sync";

/**
 * Broadcast an event over Supabase Realtime broadcast channels.
 * Enables immediate instant push to all connected browsers.
 */
export async function broadcastRealtimeEvent(
  channelName: string,
  event: string,
  payload: any
): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const channel = supabaseServer.channel(channelName);
    // Subscribe if not yet subscribed, then send
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel
          .send({
            type: "broadcast",
            event,
            payload,
          })
          .then(() => {
            supabaseServer.removeChannel(channel);
          })
          .catch(() => {});
      }
    });
  } catch (err: any) {
    console.warn(`[RealtimeBroadcast] Notice on channel '${channelName}':`, err?.message || err);
  }
}
