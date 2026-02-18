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

  const { data: row, error } = await supabase
    .from("users")
    .select("is_pro, plan, autoscan_expires_at")
    .eq("email", user.email.toLowerCase())
    .single();

  // Handle case where user doesn't exist in users table yet (PGRST116 = no rows returned)
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user data:", error);
  }

  const hasAutoscan =
    row?.plan === "autoscan" &&
    row?.autoscan_expires_at &&
    new Date(row.autoscan_expires_at) > new Date();

  return NextResponse.json({
    isPro: !!row?.is_pro,
    hasAutoscan: !!hasAutoscan,
  });
}
