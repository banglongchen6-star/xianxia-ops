import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { clientId, email, name } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "无权限" }, { status: 403 });

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: inviteData, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name, role: "client" },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=portal`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await adminClient.from("profiles").upsert({
    id: inviteData.user.id,
    name,
    role: "client",
  });

  await adminClient.from("clients").update({ user_id: inviteData.user.id }).eq("id", clientId);

  return NextResponse.json({ ok: true });
}
