import { AppUser, LoginSession } from "./types";
import { saveDocument, deleteDocument } from "./localDatabase";

export function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  let device = "Unknown Device";
  if (/mobile/i.test(ua)) device = "Mobile";
  if (/like Mac OS X/.test(ua)) device = "iOS Device";
  if (/Android/.test(ua)) device = "Android Device";
  if (/Windows NT/.test(ua)) device = "Windows PC";
  if (/Macintosh/.test(ua)) device = "Mac";
  if (/Linux/.test(ua) && !/Android/.test(ua)) device = "Linux PC";
  
  let browser = "Unknown Browser";
  if (/Chrome/.test(ua)) browser = "Chrome";
  if (/Firefox/.test(ua)) browser = "Firefox";
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  if (/Edge/.test(ua)) browser = "Edge";
  if (/MSIE|Trident/.test(ua)) browser = "IE";

  return `${device} - ${browser}`;
}

export function registerSession(user: AppUser) {
  let deviceId = localStorage.getItem("ALW_DEVICE_ID");
  if (!deviceId) {
    deviceId = "DEV-" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("ALW_DEVICE_ID", deviceId);
  }

  const session: LoginSession = {
    id: deviceId,
    userId: user.id,
    username: user.username,
    role: user.role,
    deviceInfo: getDeviceInfo(),
    loginTime: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    passwordPlain: user.passwordPlain
  };

  const storedSessions = localStorage.getItem("ALW_LOGIN_SESSIONS");
  let sessions: LoginSession[] = storedSessions ? JSON.parse(storedSessions) : [];
  
  // Remove existing session for this device if any
  sessions = sessions.filter(s => s.id !== deviceId);
  sessions.push(session);
  
  localStorage.setItem("ALW_LOGIN_SESSIONS", JSON.stringify(sessions));

  // Sync to Firestore
  saveDocument("sessions", deviceId, session).catch((err) => {
    console.warn("Failed to save login session to Firestore:", err);
  });
}

export function updateSessionActivity(): boolean {
  const deviceId = localStorage.getItem("ALW_DEVICE_ID");
  if (!deviceId) return false;

  const storedSessions = localStorage.getItem("ALW_LOGIN_SESSIONS");
  if (!storedSessions) return false;

  try {
    let sessions: LoginSession[] = JSON.parse(storedSessions);
    const sessionIndex = sessions.findIndex(s => s.id === deviceId);
    if (sessionIndex >= 0) {
      const updatedSession = {
        ...sessions[sessionIndex],
        lastActive: new Date().toISOString()
      };
      sessions[sessionIndex] = updatedSession;
      localStorage.setItem("ALW_LOGIN_SESSIONS", JSON.stringify(sessions));

      // Sync updated session activity to Firestore
      saveDocument("sessions", deviceId, updatedSession).catch((err) => {
        console.warn("Failed to update session activity in Firestore:", err);
      });
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export function getActiveSessions(): LoginSession[] {
  const storedSessions = localStorage.getItem("ALW_LOGIN_SESSIONS");
  if (!storedSessions) return [];
  try {
    return JSON.parse(storedSessions);
  } catch (e) {
    return [];
  }
}

export function removeSession(deviceId: string) {
  const storedSessions = localStorage.getItem("ALW_LOGIN_SESSIONS");
  if (!storedSessions) return;
  try {
    let sessions: LoginSession[] = JSON.parse(storedSessions);
    sessions = sessions.filter(s => s.id !== deviceId);
    localStorage.setItem("ALW_LOGIN_SESSIONS", JSON.stringify(sessions));
  } catch (e) {}

  // Sync delete to Firestore
  deleteDocument("sessions", deviceId).catch((err) => {
    console.warn("Failed to delete login session from Firestore:", err);
  });
}

export function removeCurrentSession() {
  const deviceId = localStorage.getItem("ALW_DEVICE_ID");
  if (deviceId) {
    removeSession(deviceId);
  }
}
