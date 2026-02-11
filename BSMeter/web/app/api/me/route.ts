import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ isPro: false });
  }

  const { data: row } = await supabase
    .from("users")
    .select("is_pro, plan, autoscan_expires_at")
    .eq("email", user.email.toLowerCase())
    .single();

  const hasAutoscan =
    row?.plan === "autoscan" &&
    row?.autoscan_expires_at &&
    new Date(row.autoscan_expires_at) > new Date();

  return NextResponse.json({
    isPro: !!row?.is_pro,
    hasAutoscan: !!hasAutoscan,
  });
}
