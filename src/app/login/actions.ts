"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SITE_AUTH_COOKIE,
  SITE_AUTH_MAX_AGE,
  createSiteAuthToken,
  isCorrectSitePassword,
} from "@/lib/site-auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!isCorrectSitePassword(password)) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(SITE_AUTH_COOKIE, createSiteAuthToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SITE_AUTH_MAX_AGE,
    path: "/",
  });

  redirect("/");
}
