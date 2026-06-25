import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  email: string;
};

function getAdminEmail() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is not configured.");
  }
  return adminEmail;
}

export async function getSessionUserEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.email?.trim().toLowerCase() ?? null;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const email = await getSessionUserEmail();
  if (!email || email !== getAdminEmail()) {
    return null;
  }
  return { email };
}

export async function requireAdminUser() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

export async function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && email.trim().toLowerCase() === getAdminEmail());
}
