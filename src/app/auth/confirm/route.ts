import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles the email sign-in link. Supports both the token_hash style
// (recommended, works across devices) and the older ?code style. Once a
// session is established, ensures the user has a profile and sends them in.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = createClient();
  let ok = false;

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const name =
        (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Me";
      await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: name }, { onConflict: "id" });
    }
    return NextResponse.redirect(`${origin}/`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
