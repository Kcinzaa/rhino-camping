import { getLiffProfile } from "@/lib/liff";

export type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  role?: "USER" | "ADMIN";
  isDevMode?: boolean;
};

const STORAGE_KEY = "rhino_line_profile";
const LEGACY_STORAGE_KEY = "camp_line_profile";

function getAdminLineUserIds() {
  return (process.env.NEXT_PUBLIC_ADMIN_LINE_USER_IDS || "test-line-admin-001")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function withRole(profile: Omit<LineProfile, "role">): LineProfile {
  const isAdmin = getAdminLineUserIds().includes(profile.userId);

  return {
    ...profile,
    role: isAdmin ? "ADMIN" : "USER",
  };
}

export function getDevLineProfile(): LineProfile {
  return withRole({
    userId: process.env.NEXT_PUBLIC_DEV_LINE_USER_ID || "dev-line-user-001",
    displayName:
      process.env.NEXT_PUBLIC_DEV_LINE_DISPLAY_NAME || "ผู้ใช้ทดสอบ",
    pictureUrl: process.env.NEXT_PUBLIC_DEV_LINE_PICTURE_URL || "",
    isDevMode: true,
  });
}

export function shouldUseDevLine() {
  return process.env.NEXT_PUBLIC_USE_DEV_LINE === "true";
}

export function saveLineProfile(profile: LineProfile) {
  if (typeof window === "undefined") return;

  const value = JSON.stringify(profile);
  localStorage.setItem(STORAGE_KEY, value);
  localStorage.setItem(LEGACY_STORAGE_KEY, value);
}

export function getSavedLineProfile(): LineProfile | null {
  if (typeof window === "undefined") return null;

  const raw =
    localStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem(LEGACY_STORAGE_KEY);

  if (!raw) return null;

  try {
    return withRole(JSON.parse(raw) as LineProfile);
  } catch {
    return null;
  }
}

export async function getLineProfile(): Promise<LineProfile> {
  const saved = getSavedLineProfile();

  if (saved && shouldUseDevLine()) {
    return saved;
  }

  if (shouldUseDevLine()) {
    const devProfile = getDevLineProfile();
    saveLineProfile(devProfile);
    return devProfile;
  }

  const profile = withRole(await getLiffProfile());
  saveLineProfile(profile);

  return profile;
}
