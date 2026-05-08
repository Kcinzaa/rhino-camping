export type LineProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  isDevMode?: boolean;
};

const LIFF_LOGIN_STARTED_KEY = "rhino_liff_login_started";
const LIFF_LOGIN_ATTEMPTED_KEY = "rhino_liff_login_attempted";
const LOGIN_ATTEMPT_TTL_MS = 1000 * 60 * 5;

function getDevProfile(): LineProfile {
  const devUserId =
    process.env.NEXT_PUBLIC_DEV_LINE_USER_ID || "test-line-user-001";

  const isAdmin = devUserId === "test-line-admin-001";

  return {
    userId: devUserId,
    displayName: isAdmin ? "Admin Tester" : "Test Customer",
    pictureUrl: "",
    isDevMode: true,
  };
}

function canUseDevProfile() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_DEV_LINE_PROFILE === "true"
  );
}

function getLiffRequiredError() {
  return new Error(
    "ยังไม่ได้ตั้งค่า LINE LIFF สำหรับระบบจอง กรุณาตั้งค่า NEXT_PUBLIC_LIFF_ID"
  );
}

function getCleanRedirectUri() {
  const url = new URL(window.location.href);

  url.hash = "";
  url.searchParams.delete("liff.state");
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("friendship_status_changed");

  return url.toString();
}

function clearLiffCallbackParams() {
  const url = new URL(window.location.href);
  const callbackKeys = [
    "liff.state",
    "code",
    "state",
    "friendship_status_changed",
  ];

  let changed = false;

  for (const key of callbackKeys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (url.hash) {
    url.hash = "";
    changed = true;
  }

  if (changed) {
    window.history.replaceState(null, "", url.toString());
  }
}

function getLoginAttemptedAt() {
  return Number(
    window.sessionStorage.getItem(LIFF_LOGIN_ATTEMPTED_KEY) ||
      window.localStorage.getItem(LIFF_LOGIN_ATTEMPTED_KEY) ||
      0
  );
}

function markLoginAttempted() {
  const value = String(Date.now());
  window.sessionStorage.setItem(LIFF_LOGIN_STARTED_KEY, value);
  window.sessionStorage.setItem(LIFF_LOGIN_ATTEMPTED_KEY, value);
  window.localStorage.setItem(LIFF_LOGIN_ATTEMPTED_KEY, value);
}

function clearLoginAttempted() {
  window.sessionStorage.removeItem(LIFF_LOGIN_STARTED_KEY);
  window.sessionStorage.removeItem(LIFF_LOGIN_ATTEMPTED_KEY);
  window.localStorage.removeItem(LIFF_LOGIN_ATTEMPTED_KEY);
}

export async function getLiffProfile(): Promise<LineProfile> {
  try {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();

    if (!liffId) {
      if (!canUseDevProfile()) {
        throw getLiffRequiredError();
      }

      return getDevProfile();
    }

    if (typeof window === "undefined") {
      if (!canUseDevProfile()) {
        throw getLiffRequiredError();
      }

      return getDevProfile();
    }

    const liff = (await import("@line/liff")).default;

    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      const loginStartedAt = Number(
        window.sessionStorage.getItem(LIFF_LOGIN_STARTED_KEY) || 0
      );
      const loginRecentlyStarted = Date.now() - loginStartedAt < 10000;
      const loginAttemptedAt = getLoginAttemptedAt();
      const loginAttemptRecentlyFailed =
        Date.now() - loginAttemptedAt < LOGIN_ATTEMPT_TTL_MS;

      if (loginRecentlyStarted || loginAttemptRecentlyFailed) {
        throw new Error(
          "กำลังรอการยืนยันตัวตนจาก LINE กรุณากลับมาที่หน้านี้อีกครั้ง"
        );
      }

      markLoginAttempted();
      liff.login({
        redirectUri: getCleanRedirectUri(),
      });

      if (!canUseDevProfile()) {
        throw new Error("กำลังพาเข้าสู่ระบบ LINE");
      }

      return getDevProfile();
    }

    clearLoginAttempted();
    clearLiffCallbackParams();

    const profile = await liff.getProfile();

    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl || "",
      isDevMode: false,
    };
  } catch (error) {
    if (!canUseDevProfile()) {
      throw error;
    }

    console.warn("LIFF load failed, fallback to dev profile:", error);

    return getDevProfile();
  }
}
