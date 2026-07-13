// Instagram Graph API (Content Publishing)
// Requires: META_APP_ID, META_APP_SECRET in .env.local
// Works only on deployed URL (not localhost) — images need public URLs

const IG_API = "https://graph.instagram.com/v21.0";
const FB_API = "https://graph.facebook.com/v21.0";

export function getInstagramAuthUrl(redirectUri: string): string {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_read_engagement",
  ].join(",");

  return `https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; userId: string }> {
  const res = await fetch(
    `${FB_API}/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: redirectUri,
        code,
      })
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  // Get long-lived token
  const longRes = await fetch(
    `${FB_API}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        fb_exchange_token: data.access_token,
      })
  );
  const longData = await longRes.json();

  // Get Instagram Business Account ID
  const meRes = await fetch(
    `${FB_API}/me/accounts?access_token=${longData.access_token}`
  );
  const meData = await meRes.json();
  const page = meData.data?.[0];
  if (!page) throw new Error("Nenhuma Página do Facebook encontrada. Conecte uma Página com conta Instagram Profissional.");

  const igRes = await fetch(
    `${FB_API}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
  );
  const igData = await igRes.json();
  const igUserId = igData.instagram_business_account?.id;
  if (!igUserId) throw new Error("Conta Instagram Profissional não encontrada nessa Página.");

  return { accessToken: longData.access_token, userId: igUserId };
}

export async function publishPhoto(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<{ id: string }> {
  // Step 1: Create media container
  const containerRes = await fetch(`${IG_API}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    }),
  });
  const container = await containerRes.json();
  if (container.error) throw new Error(container.error.message);

  // Step 2: Wait a moment for processing
  await new Promise((r) => setTimeout(r, 2000));

  // Step 3: Publish container
  const publishRes = await fetch(`${IG_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: container.id,
      access_token: accessToken,
    }),
  });
  const published = await publishRes.json();
  if (published.error) throw new Error(published.error.message);

  return { id: published.id };
}

export async function getAccountInfo(
  igUserId: string,
  accessToken: string
): Promise<{ username: string; profilePicture: string; followersCount: number }> {
  const res = await fetch(
    `${IG_API}/${igUserId}?fields=username,profile_picture_url,followers_count&access_token=${accessToken}`
  );
  const data = await res.json();
  return {
    username: data.username || "",
    profilePicture: data.profile_picture_url || "",
    followersCount: data.followers_count || 0,
  };
}
