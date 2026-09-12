// Client-side authentication helpers for admin management

export async function checkAdminSession(): Promise<boolean> {
  try {
    const token = sessionStorage.getItem("afit_admin_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch("/api/admin/session", {
      credentials: "include",
      headers
    });

    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.authenticated);
  } catch (err) {
    console.error("Session check failed:", err);
    return false;
  }
}

export async function loginAdmin(password: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      credentials: "include"
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.token) {
        sessionStorage.setItem("afit_admin_token", data.token);
      }
      return { success: true, message: data.message || "Authentication successful" };
    }

    return {
      success: false,
      message: data.message || "Invalid administrator credentials."
    };
  } catch {
    return {
      success: false,
      message: "Connection error. Unable to verify credentials with server."
    };
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    const token = sessionStorage.getItem("afit_admin_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
      headers
    });
  } finally {
    sessionStorage.removeItem("afit_admin_token");
  }
}
