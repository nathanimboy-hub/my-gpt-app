import { User } from "@supabase/supabase-js";
import { UserRole } from "./types";

export function getUserRole(user: User | null): UserRole {
  if (!user) {
    return "employee";
  }

  const metadataRole = user.user_metadata?.role ?? user.app_metadata?.role;
  return metadataRole === "admin" ? "admin" : "employee";
}
