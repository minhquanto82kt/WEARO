import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@vercel/flags-core";

const AI_TRY_ON_FLAG = "ai_try_on";

export async function isAiTryOnEnabled() {
  // Vercel currently stores the connection string as FLAGS_SECRET in this project.
  const sdkKey = process.env.FLAGS ?? process.env.FLAGS_SECRET;

  // Fail closed when Vercel Flags is not configured locally or in a deployment.
  if (!sdkKey) return false;

  const client = createClient(sdkKey, {
    stream: false,
    polling: false,
  });

  await client.initialize();
  const result = await client.evaluate<boolean>(AI_TRY_ON_FLAG, false);

  return result.value;
}

export const getAiTryOnEnabled = createServerFn({ method: "GET" }).handler(async () => {
  return isAiTryOnEnabled();
});
