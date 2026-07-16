import { createClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });
    if (error) {
      return NextResponse.redirect(new URL("/login?error=confirmation_failed", request.url));
    }
  } else {
    return NextResponse.redirect(new URL("/login?error=missing_params", request.url));
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const { data: plantation } = await supabase
      .from("plantations")
      .select("id")
      .eq("user_id", session.user.id)
      .limit(1)
      .single();

    if (!plantation) {
      return NextResponse.redirect(new URL("/onboarding/plantation", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
