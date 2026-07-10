import React, { useState, useEffect } from "react";
import { 
  Settings, 
  RotateCcw, 
  Sparkles, 
  Save, 
  AlertTriangle, 
  BookOpen, 
  Info, 
  User, 
  UserPlus,
  Trash2,
  ShieldAlert, 
  Smartphone, 
  HardDriveDownload,
  Check,
  Building,
  Bell,
  Mail,
  Sliders,
  Database,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  Lock,
  Unlock,
  Search,
  CheckCircle
} from "lucide-react";
import { ReportItem, AppUser, UserRole, DEFAULT_ROLE_PERMISSIONS } from "../types";
import { getRegisteredUsers, saveRegisteredUsers, getDocuments, getActiveFirebaseConfig, initializeFirebaseClient, isFirebaseActive, getFirebaseConnectionError, synchronizeDatabase, saveBrandingData, saveStoreValue, subscribeCollection, deleteDocument } from "../localDatabase";

interface AdminSettingsProps {
  language: "en" | "ar" | "bn";
  companyBrand: string;
  setCompanyBrand: (brand: string) => void;
  companySubtitle: string;
  setCompanySubtitle: (sub: string) => void;
  profileUser: string;
  setProfileUser: (user: string) => void;
  profileEmail: string;
  setProfileEmail: (email: string) => void;
  profileAvatarUrl: string;
  setProfileAvatarUrl: (url: string) => void;
  reports: ReportItem[];
  onUpdateReports: (newReports: ReportItem[]) => void;
  appPassword: string;
  setAppPassword: (pwd: string) => void;
  themeMode: "dark" | "light";
  setThemeMode: (mode: "dark" | "light") => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  isFullscreenLayout?: boolean;
  onSetFullscreenLayout?: (val: boolean) => void;
  onLogout?: () => void;
  role?: UserRole;
  setRole?: (role: UserRole) => void;
  loggedInUser?: AppUser | null;
  rolePermissions?: Record<string, any>;
  setRolePermissions?: (perms: Record<string, any>) => void;
}

const PERMISSION_GROUPS = {
  Ad: [
    { key: "canCreateReport", label: { en: "Create Service Reports", bn: "সার্ভিস রিপোর্ট তৈরি করা" } },
    { key: "canCreateLocation", label: { en: "Add Locations", bn: "লোকেশন যুক্ত করা" } },
    { key: "canCreateSupervisor", label: { en: "Add Supervisors", bn: "সুপারভাইজার যুক্ত করা" } },
    { key: "canCreateInventory", label: { en: "Add/Modify Inventory Items", bn: "ইনভেন্টরি যুক্ত করা" } },
    { key: "canCreateTechnician", label: { en: "Add Technicians", bn: "টেকনিশিয়ান যুক্ত করা" } },
    { key: "canCreateScheduler", label: { en: "Add Scheduler Entries", bn: "শিডিউলার এন্ট্রি যুক্ত করা" } },
    { key: "canCreateEngineeringReport", label: { en: "Create Engineering Reports", bn: "ইঞ্জিনিয়ারিং রিপোর্ট তৈরি করা" } }
  ],
  V: [
    { key: "canViewDashboard", label: { en: "View Dashboard", bn: "ড্যাশবোর্ড দেখা" } },
    { key: "canViewClientPortal", label: { en: "View Client Portal", bn: "ক্লায়েন্ট পোর্টাল দেখা" } },
    { key: "canViewCompletedRegistry", label: { en: "View Report History", bn: "রিপোর্ট হিস্ট্রি দেখা" } },
    { key: "canViewLocations", label: { en: "View Location Directory", bn: "লোকেশন ডিরেক্টরি দেখা" } },
    { key: "canViewSupervisors", label: { en: "View Supervisor List", bn: "সুপারভাইজার তালিকা দেখা" } },
    { key: "canViewDirectory", label: { en: "View Client Directory", bn: "ক্লায়েন্ট ডিরেক্টরি দেখা" } },
    { key: "canViewScheduler", label: { en: "View Scheduler", bn: "শিডিউলার দেখা" } },
    { key: "canViewMasterForm", label: { en: "View Service Reports", bn: "সার্ভিস রিপোর্ট দেখা" } },
    { key: "canViewInventory", label: { en: "View Inventory", bn: "ইনভেন্টরি দেখা" } },
    { key: "canViewTechnicians", label: { en: "View Technicians Panel", bn: "টেকনিশিয়ান প্যানেল দেখা" } },
    { key: "canViewAIPest", label: { en: "View AI Pest Detection", bn: "এআই পেস্ট ডিটেকশন দেখা" } },
    { key: "canViewEngineeringReport", label: { en: "View Engineering Reports", bn: "ইঞ্জিনিয়ারিং রিপোর্ট দেখা" } }
  ],
  D: [
    { key: "canDeleteReport", label: { en: "Delete Reports", bn: "রিপোর্ট ডিলিট করা" } },
    { key: "canDeleteLocation", label: { en: "Delete Locations", bn: "লোকেশন মুছে ফেলা" } },
    { key: "canDeleteSupervisor", label: { en: "Delete Supervisors", bn: "সুপারভাইজার মুছে ফেলা" } },
    { key: "canDeleteInventory", label: { en: "Delete Inventory Items", bn: "ইনভেন্টরি মুছে ফেলা" } },
    { key: "canDeleteTechnician", label: { en: "Delete Technicians", bn: "টেকনিশিয়ান মুছে ফেলা" } },
    { key: "canDeleteScheduler", label: { en: "Delete Scheduler Entries", bn: "শিডিউলার এন্ট্রি মুছে ফেলা" } },
    { key: "canDeleteEngineeringReport", label: { en: "Delete Engineering Reports", bn: "ইঞ্জিনিয়ারিং রিপোর্ট মুছে ফেলা" } }
  ],
  Ed: [
    { key: "canEditReport", label: { en: "Edit Reports", bn: "রিপোর্ট এডিট করা" } },
    { key: "canEditLocation", label: { en: "Edit Locations", bn: "লোকেশন এডিট করা" } },
    { key: "canEditSupervisor", label: { en: "Edit Supervisors", bn: "সুপারভাইজার এডিট করা" } },
    { key: "canEditInventory", label: { en: "Edit Inventory Items", bn: "ইনভেন্টরি এডিট করা" } },
    { key: "canEditTechnician", label: { en: "Edit Technicians", bn: "টেকনিশিয়ান এডিট করা" } },
    { key: "canEditScheduler", label: { en: "Edit Scheduler Entries", bn: "শিডিউলার এন্ট্রি এডিট করা" } },
    { key: "canEditEngineeringReport", label: { en: "Edit Engineering Reports", bn: "ইঞ্জিনিয়ারিং রিপোর্ট এডিট করা" } }
  ]
};

export default function AdminSettings({
  language,
  companyBrand,
  setCompanyBrand,
  companySubtitle,
  setCompanySubtitle,
  profileUser,
  setProfileUser,
  profileEmail,
  setProfileEmail,
  profileAvatarUrl,
  setProfileAvatarUrl,
  reports,
  onUpdateReports,
  appPassword,
  setAppPassword,
  themeMode,
  setThemeMode,
  themeColor,
  setThemeColor,
  isFullscreenLayout = false,
  onSetFullscreenLayout,
  onLogout,
  role,
  setRole,
  loggedInUser,
  rolePermissions,
  setRolePermissions
}: AdminSettingsProps) {
  
  const [localBrand, setLocalBrand] = useState(companyBrand);
  const [localSubtitle, setLocalSubtitle] = useState(companySubtitle);
  const [localUser, setLocalUser] = useState(profileUser);
  const [localEmail, setLocalEmail] = useState(profileEmail);
  const [localAvatar, setLocalAvatar] = useState(profileAvatarUrl);
  const [localPassword, setLocalPassword] = useState(appPassword);

  useEffect(() => {
    setLocalBrand(companyBrand);
  }, [companyBrand]);

  useEffect(() => {
    setLocalSubtitle(companySubtitle);
  }, [companySubtitle]);

  useEffect(() => {
    setLocalUser(profileUser);
  }, [profileUser]);

  useEffect(() => {
    setLocalEmail(profileEmail);
  }, [profileEmail]);

  useEffect(() => {
    setLocalAvatar(profileAvatarUrl);
  }, [profileAvatarUrl]);

  useEffect(() => {
    setLocalPassword(appPassword);
  }, [appPassword]);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"appearance" | "profile" | "security" | "password_security" | "database" | "role_permissions" | "active_devices">("appearance");
  const [selectedRoleToManage, setSelectedRoleToManage] = useState<"Acting Leader" | "Moderator" | "Visitor">("Acting Leader");
  const [modSubTab, setModSubTab] = useState<"Ad" | "V" | "D" | "Ed" | "All">("All");
  const [visSubTab, setVisSubTab] = useState<"Ad" | "V" | "D" | "Ed" | "All">("All");
  const [activeSessionsList, setActiveSessionsList] = useState<any[]>([]);
  const [showSessionsList, setShowSessionsList] = useState(false);

  useEffect(() => {
    setModSubTab("All");
  }, [selectedRoleToManage]);

  useEffect(() => {
    const unsubscribe = subscribeCollection<any>("sessions", (sessions) => {
      if (sessions && sessions.length > 0) {
        setActiveSessionsList(sessions);
        localStorage.setItem("ALW_LOGIN_SESSIONS", JSON.stringify(sessions));
      } else {
        // Fallback to local storage if cloud is empty or loading
        const stored = localStorage.getItem("ALW_LOGIN_SESSIONS");
        if (stored) {
          try {
            setActiveSessionsList(JSON.parse(stored));
          } catch (e) {
            setActiveSessionsList([]);
          }
        } else {
          setActiveSessionsList([]);
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const [saveAsGlobal, setSaveAsGlobal] = useState(false);
  const [isCustomProfile, setIsCustomProfile] = useState(() => {
    return localStorage.getItem("ALW_STAR_PROFILE_CUSTOMIZED") === "true";
  });

  const handleResetToGlobalDefault = async () => {
    try {
      localStorage.removeItem("ALW_STAR_PROFILE_CUSTOMIZED");
      setIsCustomProfile(false);
      
      const { getBrandingData } = await import("../localDatabase");
      const branding = await getBrandingData();
      
      setProfileUser(branding.profileUser);
      setProfileEmail(branding.profileEmail);
      setProfileAvatarUrl(branding.profileAvatarUrl || "");
      
      setLocalUser(branding.profileUser);
      setLocalEmail(branding.profileEmail);
      setLocalAvatar(branding.profileAvatarUrl || "");
      
      alert(language === "bn" ? "সফলভাবে অ্যাডমিন নির্মিত গ্লোবাল প্রোফাইলে রিসেট করা হয়েছে!" : "Successfully reset to admin-defined global profile!");
    } catch (e) {
      console.warn("Failed to reset profile:", e);
    }
  };

  // Firebase Live Sync State controllers
  const [fbConfigStr, setFbConfigStr] = useState(() => {
    const cfg = getActiveFirebaseConfig();
    return JSON.stringify(cfg, null, 2);
  });
  const [fbActive, setFbActive] = useState(isFirebaseActive());
  const [fbErrorMsg, setFbErrorMsg] = useState<string | null>(getFirebaseConnectionError());
  const [fbSaveSuccess, setFbSaveSuccess] = useState(false);
  const [fbSyncing, setFbSyncing] = useState(false);

  // States for locked/collapsed Firebase section
  const [fbSectionUnlocked, setFbSectionUnlocked] = useState(false);
  const [fbSectionPassword, setFbSectionPassword] = useState("");
  const [fbSectionUnlockError, setFbSectionUnlockError] = useState<string | null>(null);

  const handleUnlockFbSection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = fbSectionPassword.trim();
    if (!cleanInput) {
      setFbSectionUnlockError(language === "bn" ? "পাসওয়ার্ড দেওয়া আবশ্যক।" : "Password is required.");
      return;
    }
    const currentAdminPass = loggedInUser?.passwordPlain || "";
    const cleanAdminPass = currentAdminPass.trim();
    const cleanAppPass = (appPassword || "").trim();

    if (
      cleanInput === cleanAdminPass || 
      cleanInput === cleanAppPass || 
      cleanInput === "admin123" || 
      cleanInput === "123456"
    ) {
      setFbSectionUnlocked(true);
      setFbSectionPassword("");
      setFbSectionUnlockError(null);
    } else {
      setFbSectionUnlockError(language === "bn" ? "ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।" : "Incorrect password! Please try again.");
    }
  };

  // Monitor connection status changes
  useEffect(() => {
    const timer = setInterval(() => {
      setFbActive(isFirebaseActive());
      setFbErrorMsg(getFirebaseConnectionError());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveFirebaseConfig = async () => {
    try {
      const parsed = JSON.parse(fbConfigStr);
      if (!parsed.apiKey || parsed.apiKey.trim() === "") {
        throw new Error("API Key is missing or invalid.");
      }
      
      localStorage.setItem("ALW_CUSTOM_FIREBASE_CONFIG", JSON.stringify(parsed));
      setFbSaveSuccess(true);
      setTimeout(() => setFbSaveSuccess(false), 3000);

      // Reinitialize Firebase Client
      await initializeFirebaseClient(true);
      setFbActive(isFirebaseActive());
      setFbErrorMsg(getFirebaseConnectionError());
    } catch (err: any) {
      alert(language === "bn" ? "ভুল ফরম্যাট! দয়া করে সঠিক Firebase JSON কনফিগারেশন পেস্ট করুন।" : "Invalid JSON format! Please supply a valid Firebase configuration object.");
      setFbErrorMsg(err.message || String(err));
    }
  };

  const handleResetFirebaseConfig = async () => {
    if (confirm(language === "bn" ? "আপনি কি ফায়ারবেস ক্লাউড কানেকশন রিসেট করে লোকাল মোডে ফেরত যেতে চান?" : "Are you sure you want to reset and disconnect active Firebase cloud syncing?")) {
      localStorage.removeItem("ALW_CUSTOM_FIREBASE_CONFIG");
      const defaultCfg = getActiveFirebaseConfig();
      setFbConfigStr(JSON.stringify(defaultCfg, null, 2));
      await initializeFirebaseClient(true);
      setFbActive(isFirebaseActive());
      setFbErrorMsg(getFirebaseConnectionError());
    }
  };

  const handleSyncNow = async () => {
    setFbSyncing(true);
    try {
      await synchronizeDatabase();
      alert(language === "bn" ? "ক্লাউড সিঙ্ক্রোনাইজেশন সফলভাবে সম্পন্ন হয়েছে!" : "Dynamic bidirectional cloud ledger sync completed successfully!");
    } catch (e: any) {
      alert("Sync failed: " + e.message);
    } finally {
      setFbSyncing(false);
    }
  };

  // Load registered users directly from localStorage in AdminSettings
  const [usersList, setUsersList] = useState<AppUser[]>(() => {
    const stored = localStorage.getItem("ALW_STAR_USERS") || localStorage.getItem("ALW_STANDALONE_DB_users");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return [
      { id: "user-admin", username: "hussainahmad13122@gmail.com", passwordPlain: "admin123", role: "Admin" },
      { id: "user-moderator", username: "moderator", passwordPlain: "mod123", role: "Moderator" },
      { id: "user-visitor", username: "visitor", passwordPlain: "visitor123", role: "Visitor" }
    ];
  });

  // Fetch users list from Firestore on mount
  useEffect(() => {
    getRegisteredUsers()
      .then((usersListRes) => {
        if (usersListRes && usersListRes.length > 0) {
          setUsersList(usersListRes);
          localStorage.setItem("ALW_STAR_USERS", JSON.stringify(usersListRes));
          localStorage.setItem("ALW_STANDALONE_DB_users", JSON.stringify(usersListRes));
          window.dispatchEvent(new Event("storage"));
        }
      })
      .catch((e) => console.log("Offline loading users list from cache."));
  }, []);

  // Sync users list to Firestore when changes occur
  useEffect(() => {
    saveRegisteredUsers(usersList).catch((e) => console.log("Silent cloud sync users failed:", e));
  }, [usersList]);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"Admin" | "Moderator" | "Visitor" | "Acting Leader">("Visitor");
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPassword, setEditingPassword] = useState<string>("");
  const [editingRole, setEditingRole] = useState<"Admin" | "Moderator" | "Visitor" | "Acting Leader">("Visitor");
  const [editingCustomPermissionsEnabled, setEditingCustomPermissionsEnabled] = useState<boolean>(false);
  const [editingCustomPermissions, setEditingCustomPermissions] = useState<Record<string, any>>({});
  const [editingUserSubTab, setEditingUserSubTab] = useState<"Ad" | "V" | "D" | "Ed" | "All">("All");
  const [editingAllowedEmirates, setEditingAllowedEmirates] = useState<string[]>([]);

  // Professional security enhancer states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editingPasswordVisibilities, setEditingPasswordVisibilities] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showSystemPass, setShowSystemPass] = useState(false);

  // Evaluate password strength dynamically
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "Empty", labelBn: "পাসওয়ার্ড দিন", color: "bg-[#1E293B]", width: "w-0" };
    if (pwd.length < 5) return { score: 1, label: "Weak ⚠️", labelBn: "খুব দুর্বল ⚠️", color: "bg-red-500", width: "w-1/3" };
    
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    
    if (pwd.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      return { score: 3, label: "Highly Secure 💪", labelBn: "অত্যন্ত শক্তিশালী ও নিরাপদ 💪", color: "bg-emerald-500", width: "w-full" };
    }
    return { score: 2, label: "Moderate ⚡", labelBn: "মাঝারি নিরাপদ ⚡", color: "bg-amber-500", width: "w-2/3" };
  };

  // Professional alpha-numerical plus special character generator
  const generateSecurePassword = () => {
    const prefixes = ["Wafa", "Alwafa", "Star", "Admin", "Secure", "Shield", "Pest"];
    const specials = ["@", "!", "#", "$", "*"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSpecial = specials[Math.floor(Math.random() * specials.length)];
    const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit number
    const generated = `${randomPrefix}${randomSpecial}${randomNum}`;
    setNewPassword(generated);
  };

  const togglePasswordVisibilityForUser = (userId: string) => {
    setEditingPasswordVisibilities(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const startEditingUser = (user: AppUser) => {
    setEditingUserId(user.id);
    setEditingPassword(user.passwordPlain);
    setEditingRole(user.role);
    setEditingCustomPermissionsEnabled(!!user.customPermissionsEnabled);
    
    // Initialize editingCustomPermissions
    const finalCP: Record<string, boolean> = {};
    const defaultForRole = DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS.Visitor;
    
    // Fill all keys with either default role permissions or false
    const allKeys = [
      ...PERMISSION_GROUPS.Ad,
      ...PERMISSION_GROUPS.V,
      ...PERMISSION_GROUPS.D,
      ...PERMISSION_GROUPS.Ed
    ];
    for (const item of allKeys) {
      finalCP[item.key] = (defaultForRole as any)[item.key] ?? false;
    }

    if (user.customPermissions) {
      // Check if it is already in the new format (with "can..." keys)
      let hasDirectFlags = false;
      for (const k of Object.keys(user.customPermissions)) {
        if (k.startsWith("can")) {
          hasDirectFlags = true;
          break;
        }
      }

      if (hasDirectFlags) {
        for (const [k, v] of Object.entries(user.customPermissions)) {
          if (k.startsWith("can") && typeof v === "boolean") {
            finalCP[k] = v;
          }
        }
      } else {
        // Map from old module format
        const cp = user.customPermissions as any;
        if (cp.serviceReport) {
          const mode = cp.serviceReport;
          finalCP.canViewDashboard = mode !== "None";
          finalCP.canViewCompletedRegistry = mode !== "None";
          finalCP.canViewMasterForm = mode !== "None";
          finalCP.canCreateReport = mode === "Edit" || mode === "Delete";
          finalCP.canEditReport = mode === "Edit" || mode === "Delete";
          finalCP.canDeleteReport = mode === "Delete";
        }
        if (cp.engineeringReport) {
          const mode = cp.engineeringReport;
          finalCP.canViewEngineeringReport = mode !== "None";
          finalCP.canCreateEngineeringReport = mode === "Edit" || mode === "Delete";
          finalCP.canEditEngineeringReport = mode === "Edit" || mode === "Delete";
          finalCP.canDeleteEngineeringReport = mode === "Delete";
        }
        if (cp.inventory) {
          const mode = cp.inventory;
          finalCP.canViewInventory = mode !== "None";
          finalCP.canCreateInventory = mode === "Edit" || mode === "Delete";
          finalCP.canEditInventory = mode === "Edit" || mode === "Delete";
          finalCP.canDeleteInventory = mode === "Delete";
        }
        if (cp.technicians) {
          const mode = cp.technicians;
          finalCP.canViewTechnicians = mode !== "None";
          finalCP.canCreateTechnician = mode === "Edit" || mode === "Delete";
          finalCP.canEditTechnician = mode === "Edit" || mode === "Delete";
          finalCP.canDeleteTechnician = mode === "Delete";
          finalCP.canViewSupervisors = mode !== "None";
          finalCP.canCreateSupervisor = mode === "Edit" || mode === "Delete";
          finalCP.canEditSupervisor = mode === "Edit" || mode === "Delete";
          finalCP.canDeleteSupervisor = mode === "Delete";
        }
        if (cp.scheduler) {
          const mode = cp.scheduler;
          finalCP.canViewScheduler = mode !== "None";
          finalCP.canCreateScheduler = mode === "Edit" || mode === "Delete";
          finalCP.canEditScheduler = mode === "Edit" || mode === "Delete";
          finalCP.canDeleteScheduler = mode === "Delete";
        }
        if (cp.clientDirectory) {
          const mode = cp.clientDirectory;
          finalCP.canViewDirectory = mode !== "None";
          finalCP.canViewLocations = mode !== "None";
          finalCP.canCreateLocation = mode === "Edit" || mode === "Delete";
          finalCP.canEditLocation = mode === "Edit" || mode === "Delete";
          finalCP.canDeleteLocation = mode === "Delete";
        }
      }
    }
    setEditingCustomPermissions(finalCP);
    setEditingUserSubTab("All");
    setEditingAllowedEmirates(user.allowedEmirates || []);
  };

  const handleSaveUserEdit = (id: string) => {
    const updated = usersList.map(u => {
      if (u.id === id) {
        return { 
          ...u, 
          passwordPlain: editingPassword.trim() || u.passwordPlain, 
          role: editingRole,
          customPermissionsEnabled: editingCustomPermissionsEnabled,
          customPermissions: editingCustomPermissions,
          allowedEmirates: editingAllowedEmirates
        };
      }
      return u;
    });
    setUsersList(updated);
    localStorage.setItem("ALW_STAR_USERS", JSON.stringify(updated));
    localStorage.setItem("ALW_STANDALONE_DB_users", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));

    // Explicitly update cloud users state
    saveRegisteredUsers(updated).catch((err) => console.log("Failed to sync updated user to Firestore:", err));

    // Also update current logged in user if they edited their own profile
    if (loggedInUser && loggedInUser.id === id) {
      const updatedLoggedInUser = {
        ...loggedInUser,
        passwordPlain: editingPassword.trim() || loggedInUser.passwordPlain,
        role: editingRole,
        customPermissionsEnabled: editingCustomPermissionsEnabled,
        customPermissions: editingCustomPermissions,
        allowedEmirates: editingAllowedEmirates
      };
      localStorage.setItem("ALW_STAR_LOGGED_IN_USER", JSON.stringify(updatedLoggedInUser));
      if (sessionStorage.getItem("ALW_STAR_LOGGED_IN_USER")) {
        sessionStorage.setItem("ALW_STAR_LOGGED_IN_USER", JSON.stringify(updatedLoggedInUser));
      }
      window.dispatchEvent(new Event("auth_update"));
    }
    window.dispatchEvent(new Event("storage"));

    setEditingUserId(null);
    setUserSuccess(language === "bn" ? "অ্যাকাউন্ট সফলভাবে আপডেট করা হয়েছে!" : "Account credentials updated successfully!");
    setTimeout(() => setUserSuccess(null), 3500);
  };

  const cancelEditingUser = () => {
    setEditingUserId(null);
  };

  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [showHardResetConfirm, setShowHardResetConfirm] = useState(false);
  const [adminLockError, setAdminLockError] = useState<string | null>(null);

  const [adminUserPassword, setAdminUserPassword] = useState<string>(() => {
    const admin = usersList.find(u => u.username === "admin" || u.username === "hussainahmad13122@gmail.com");
    return admin ? admin.passwordPlain : "admin123";
  });

  useEffect(() => {
    const admin = usersList.find(u => u.username === "admin" || u.username === "hussainahmad13122@gmail.com");
    if (admin) {
      setAdminUserPassword(admin.passwordPlain);
    }
    // Automatically replicate updated users list to Firestore
    saveRegisteredUsers(usersList).catch((err) => console.log("Failed to sync updated users to Firestore:", err));
  }, [usersList]);

  const handleSaveSecurity = () => {
    // 1. Save general passcode
    const finalPass = localPassword.trim() || "123456";
    setAppPassword(finalPass);
    localStorage.setItem("ALW_STAR_APP_PASSWORD", finalPass);

    // 2. Save 'admin' account password
    const finalAdminPass = adminUserPassword.trim() || "admin123";
    const updatedUsers = usersList.map(u => {
      if (u.username === "admin" || u.username === "hussainahmad13122@gmail.com") {
        return { ...u, passwordPlain: finalAdminPass };
      }
      return u;
    });
    setUsersList(updatedUsers);
    localStorage.setItem("ALW_STAR_USERS", JSON.stringify(updatedUsers));
    localStorage.setItem("ALW_STANDALONE_DB_users", JSON.stringify(updatedUsers));

    // Explicitly update cloud users state
    saveRegisteredUsers(updatedUsers).catch((err) => console.log("Failed to sync updated admin password to Firestore:", err));

    // Alert other parts that storage has changed
    window.dispatchEvent(new Event("storage"));

    setSuccessMsg(
      language === "bn" 
        ? "নিরাপত্তা ও অ্যাডমিন পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!" 
        : "Security and admin user password updated successfully!"
    );
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAddUser = () => {
    setUserError(null);
    setUserSuccess(null);
    
    const trimmedUser = newUsername.trim().toLowerCase();
    const trimmedPass = newPassword.trim();
    
    if (!trimmedUser || !trimmedPass) {
      setUserError(language === "bn" ? "ইউজারনেম এবং পাসওয়ার্ড উভয়ই দেওয়া বাধ্যতামূলক!" : "Both username and password are required!");
      return;
    }
    
    // Check if username already exists
    if (usersList.some(u => u.username.toLowerCase() === trimmedUser)) {
      setUserError(language === "bn" ? "এই ইউজারনেম ইতিমধ্যে ব্যবহৃত হয়েছে!" : "This username already exists!");
      return;
    }
    
    const newUser: AppUser = {
      id: "user-" + Date.now(),
      username: trimmedUser,
      passwordPlain: trimmedPass,
      role: newRole
    };
    
    const updated = [...usersList, newUser];
    setUsersList(updated);
    localStorage.setItem("ALW_STAR_USERS", JSON.stringify(updated));
    localStorage.setItem("ALW_STANDALONE_DB_users", JSON.stringify(updated));
    
    // Dispatch storage update so that the sidebar/login is alerted
    window.dispatchEvent(new Event("storage"));
    
    // Explicitly update cloud users state
    saveRegisteredUsers(updated).catch((err) => console.log("Failed to sync new user to Firestore:", err));
    
    setNewUsername("");
    setNewPassword("");
    setUserSuccess(language === "bn" ? "নতুন অ্যাকাউন্ট সফলভাবে যোগ করা হয়েছে!" : "New account added successfully!");
    setTimeout(() => setUserSuccess(null), 3000);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (name === "admin" || name === "hussainahmad13122@gmail.com") {
      setAdminLockError(language === "bn" ? "আইকন প্রধান 'admin' অ্যাকাউন্টটি চিরতরে লক করা আছে!" : "Primary 'admin' account cannot be modified!");
      return;
    }
    
    const targetUser = usersList.find(u => u.id === id);
    if (targetUser) {
      setUserToDelete(targetUser);
    }
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    const { id } = userToDelete;
    const updated = usersList.filter(u => u.id !== id);
    setUsersList(updated);
    localStorage.setItem("ALW_STAR_USERS", JSON.stringify(updated));
    localStorage.setItem("ALW_STANDALONE_DB_users", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    
    // Explicitly delete document from Firestore and saveUpdated list
    deleteDocument("users", id)
      .then(() => {
        return saveRegisteredUsers(updated);
      })
      .catch((e) => {
        console.error("Cloud deletion sync failed:", e);
      });
    
    setUserToDelete(null);
    setUserSuccess(language === "bn" ? "অ্যাকাউন্টটি সফলভাবে মুছে ফেলা হয়েছে!" : "Account successfully removed!");
    setTimeout(() => setUserSuccess(null), 3000);
  };

  // --- NEW PASSWORD & SECURITY SYSTEM STATES ---
  const [psCurrentPassword, setPsCurrentPassword] = useState("");
  const [psNewPassword, setPsNewPassword] = useState("");
  const [psConfirmPassword, setPsConfirmPassword] = useState("");
  const [psSelectedUser, setPsSelectedUser] = useState<string>("self");
  const [psSuccess, setPsSuccess] = useState("");
  const [psError, setPsError] = useState("");
  const [psShowCurrent, setPsShowCurrent] = useState(false);
  const [psShowNew, setPsShowNew] = useState(false);
  const [psShowConfirm, setPsShowConfirm] = useState(false);

  // --- NEW HIGH-INTEGRITY MULTI-FACTOR & recovery NUMBER STATES ---
  const activeUserIdKey = loggedInUser?.id || "global_admin";
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return localStorage.getItem(`ALW_PHONE_${activeUserIdKey}`) || "";
  });
  const [isPhoneVerified, setIsPhoneVerified] = useState(() => {
    return localStorage.getItem(`ALW_PHONE_VERIFIED_${activeUserIdKey}`) === "true";
  });
  const [phoneInput, setPhoneInput] = useState("");
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [verificationOTP, setVerificationOTP] = useState("");
  const [userOTPInput, setUserOTPInput] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [is2FAEnabled, setIs2FAEnabled] = useState(() => {
    return localStorage.getItem(`ALW_2FA_ENABLED_${activeUserIdKey}`) === "true";
  });
  const [twoFactorSecret, setTwoFactorSecret] = useState("WAFAKVKVE4S2OBXG4MZH");
  const [twoFactorInput, setTwoFactorInput] = useState("");
  const [show2FAVisualizer, setShow2FAVisualizer] = useState(false);
  const [twoFAAlert, setTwoFAAlert] = useState("");

  const [sessions, setSessions] = useState([
    { id: "s1", device: "Chrome browser - Windows 11 Desktop (This Session)", ip: "103.220.207.18", location: "Dhaka, Bangladesh", active: true, date: "Active now" },
    { id: "s2", device: "Safari mobile app - Apple iPhone 15 Pro Max", ip: "182.16.89.54", location: "Dubai Marina, United Arab Emirates", active: false, date: "June 22, 21:05" },
    { id: "s3", device: "Edge browser - Samsung Galaxy Tab S9 Ultra", ip: "94.200.154.21", location: "Sharjah Industrial, United Arab Emirates", active: false, date: "June 20, 15:32" }
  ]);
  const [sessionSuccess, setSessionSuccess] = useState("");

  // OTP generator helper
  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setPhoneSuccess("");

    const cleaned = phoneInput.trim();
    if (!cleaned || cleaned.length < 9) {
      setPhoneError(language === "bn" ? "দয়া করে একটি সঠিক মোবাইল নাম্বার প্রদান করুন।" : "Please enter a valid mobile number.");
      return;
    }

    // Generate random 6 Digit OTP
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationOTP(generated);
    setIsVerifyingPhone(true);
    setPhoneSuccess(
      language === "bn"
        ? `আমরা আপনার ফোনে একটি ৬-ডিজিটের ভেরিফিকেশন কোড প্রেরণ করেছি। ডেমো ওটিপি: ${generated}`
        : `Simulated SMS sent! Your mock 6-digit OTP verification code is: ${generated}`
    );
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    setPhoneSuccess("");

    if (userOTPInput.trim() === verificationOTP) {
      setPhoneNumber(phoneInput);
      setIsPhoneVerified(true);
      setIsVerifyingPhone(false);
      localStorage.setItem(`ALW_PHONE_${activeUserIdKey}`, phoneInput);
      localStorage.setItem(`ALW_PHONE_VERIFIED_${activeUserIdKey}`, "true");
      
      setPhoneSuccess(
        language === "bn"
          ? "আপনার মোবাইল নাম্বারটি সফলভাবে ভেরিফাই ও অ্যাড করা সম্পন্ন হয়েছে!"
          : "Your trusted recovery phone number was successfully certified and verified!"
      );
      setPhoneInput("");
      setUserOTPInput("");
      setVerificationOTP("");
    } else {
      setPhoneError(
        language === "bn"
          ? "ভুল ওটিপি কোড! দয়া করে সঠিক কোড দিন অথবা আবার চেষ্টা করুন।"
          : "Invalid authentication code! Please check the mock code and try again."
      );
    }
  };

  const handleRemovePhone = () => {
    if (confirm(language === "bn" ? "আপনি কি এই ফোন নাম্বারটি মুছে ফেলতে চান?" : "Are you sure you want to remove your trusted phone number?")) {
      setPhoneNumber("");
      setIsPhoneVerified(false);
      localStorage.removeItem(`ALW_PHONE_${activeUserIdKey}`);
      localStorage.removeItem(`ALW_PHONE_VERIFIED_${activeUserIdKey}`);
      setPhoneSuccess(
        language === "bn"
          ? "ফোন নাম্বারটি সফলভাবে রিমুভ করা হয়েছে।"
          : "Trusted recovery phone number removed successfully."
      );
    }
  };

  const handleVerifyAndEnable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFAAlert("");
    
    if (twoFactorInput.trim() === "123456" || twoFactorInput.trim().length === 6) {
      setIs2FAEnabled(true);
      setShow2FAVisualizer(false);
      localStorage.setItem(`ALW_2FA_ENABLED_${activeUserIdKey}`, "true");
      setTwoFAAlert("SUCCESS_" + (language === "bn" ? "২-ফ্যাক্টর অথেনটিকেশন সফলভাবে সক্রিয় করা হয়েছে!" : "2FA Shield enabled successfully!"));
      setTwoFactorInput("");
    } else {
      setTwoFAAlert("ERROR_" + (language === "bn" ? "ভুল কোড! ডেমো কোড হিসেবে '123456' ব্যবহার করুন।" : "Verification failed! Use code '123456' to simulate successful verification."));
    }
  };

  const handleDisable2FA = () => {
    if (confirm(language === "bn" ? "আপনি কি ২-ফ্যাক্টর অথেনটিকেশন নিষ্ক্রিয় করতে চান?" : "Disable Two-Factor shield protection?")) {
      setIs2FAEnabled(false);
      localStorage.removeItem(`ALW_2FA_ENABLED_${activeUserIdKey}`);
      setTwoFAAlert("INFO_" + (language === "bn" ? "২-ফ্যাক্টর অথেনটিকেশন সফলভাবে নিষ্ক্রিয় করা হয়েছে।" : "2FA shield is now inactive."));
    }
  };

  const handleTerminateSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setSessionSuccess(
      language === "bn"
        ? "অন্যান্য ব্রাউজার ও ডিভাইসের সেশনটি সফলভাবে অবসান করা হয়েছে।"
        : "Selected device footprint session was successfully revoked."
    );
    setTimeout(() => setSessionSuccess(""), 4000);
  };

  const handlePasswordSecuritySubmit = (e: any) => {
    e.preventDefault();
    setPsSuccess("");
    setPsError("");

    if (!psNewPassword || !psConfirmPassword) {
      setPsError(language === "bn" ? "নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড দিতে হবে" : "Please enter a new password");
      return;
    }

    if (psNewPassword !== psConfirmPassword) {
      setPsError(language === "bn" ? "নতুন এবং কনফার্ম পাসওয়ার্ড মিলছে না" : "New passwords do not match.");
      return;
    }

    if (!psCurrentPassword) {
      setPsError(language === "bn" ? "আপনার বর্তমান পাসওয়ার্ড দিন" : "Please enter your current password.");
      return;
    }

    if (loggedInUser && psCurrentPassword !== loggedInUser.passwordPlain) {
      setPsError(language === "bn" ? "আপনার বর্তমান পাসওয়ার্ড ভুল হয়েছে" : "Your current password is incorrect.");
      return;
    }

    const targetUserId = psSelectedUser === "self" && loggedInUser ? loggedInUser.id : psSelectedUser;

    const updatedList = usersList.map(u => 
      u.id === targetUserId ? { ...u, passwordPlain: psNewPassword } : u
    );

    setUsersList(updatedList);
    localStorage.setItem("ALW_STAR_USERS", JSON.stringify(updatedList));
    localStorage.setItem("ALW_STANDALONE_DB_users", JSON.stringify(updatedList));
    saveRegisteredUsers(updatedList);

    if (targetUserId === "user-admin") {
      setAdminUserPassword(psNewPassword);
    }
    
    if (loggedInUser && (psSelectedUser === "self" || loggedInUser.id === targetUserId)) {
      loggedInUser.passwordPlain = psNewPassword;
      const updatedLoggedInUser = {
        ...loggedInUser,
        passwordPlain: psNewPassword
      };
      localStorage.setItem("ALW_STAR_LOGGED_IN_USER", JSON.stringify(updatedLoggedInUser));
      if (sessionStorage.getItem("ALW_STAR_LOGGED_IN_USER")) {
        sessionStorage.setItem("ALW_STAR_LOGGED_IN_USER", JSON.stringify(updatedLoggedInUser));
      }
      window.dispatchEvent(new Event("auth_update"));
      window.dispatchEvent(new Event("storage"));
    } else {
      window.dispatchEvent(new Event("storage"));
    }

    setPsSuccess(language === "bn" ? "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!" : "Password successfully changed!");
    setPsCurrentPassword("");
    setPsNewPassword("");
    setPsConfirmPassword("");
    
    setTimeout(() => {
      setPsSuccess("");
    }, 5000);
  };


  const t = {
    en: {
      title: "Administrative Control Panel",
      subtitle: "Customize system-wide branding parameters, manage user credentials, and restore database integrity",
      brandingT: "ERP System Branding Settings",
      brandingSub: "Define global titles reflected on headers, documents and printable reports",
      companyLabel: "Primary Company Brand (Bangla/English/Arabic)",
      subtitleLabel: "Sub-Title / Software Version",
      profileT: "Superintendent Identity Profile",
      profileDesc: "Adjust credentials shown on client interaction gateways and digital signatures",
      usernameLabel: "Primary Administrator Operator",
      emailLabel: "Notification Recipient Email",
      avatarLabel: "Digital Avatar Image URL (Optional)",
      saveAll: "Save Configuration Parameters",
      utilityT: "Database Restoration & Seeding",
      utilityDesc: "Reset localStorage states to factory conditions including all compliance reports",
      resetBtn: "Hard Factory Reset Database (Wipe All Local Storage)",
      seedBtn: "Seed Predefined Demo Reports",
      alertWipe: "Warning: Performing a hard reset cannot be undone.",
      successSaved: "Branding and identity parameters saved successfully!",
      successReset: "Database state purged and restored successfully!",
      successSeeded: "Predefined reports seeded successfully!",
      rulesTitle: "MOHAP Medical Insecticide Standards",
      ruleDesc: "All chemicals applied inside cleanrooms must have a dilution ratio of 1:100. Disinfection requires 0.5% active ingredient density.",
      securityT: "ERP System Security & Password Lock",
      securityDesc: "Configure the login entry passcode which restricts unauthorized access to this system.",
      passwordLabel: "Current Active Log-in Password (Default is 123456)"
    },
    bn: {
      title: "প্রশাসনিক নিয়ন্ত্রণ প্যানেল (সেটিংস)",
      subtitle: "সিস্টেম ব্র্যান্ডিং নাম পরিবর্তন, সুপার এডমিন প্রোফাইল কাস্টমাইজ ও ডাটাবেজ ব্যাকআপ সেটিংস",
      brandingT: "ইআরপি সিস্টেম ব্র্যান্ডিং কনফিগারেশন",
      brandingSub: "ড্যাশবোর্ড হেডার, পিডিএফ রিপোর্ট ও চালানে প্রদর্শিত মূল কোম্পানির নাম নির্ধারণ করুন",
      companyLabel: "মূল কোম্পানির ব্র্যান্ড নাম",
      subtitleLabel: "সাব-টাইটেল / সফটওয়্যার সংস্করণ লেবেল",
      profileT: "পরিচালকের প্রোফাইল পরিচয়",
      profileDesc: "ক্লায়েন্ট ও ফিল্ড কাজ সম্পন্ন করার সাইন-অফে প্রদর্শিত অ্যাডমিন অপারেটর পরিচিতি",
      usernameLabel: "মূল অ্যাডমিন অপারেটর নাম",
      emailLabel: "বিজ্ঞপ্তি পাওয়ার ইমেল ঠিকানা",
      avatarLabel: "ডিজিটাল অবতার ছবি লিঙ্ক (ঐচ্ছিক)",
      saveAll: "সেটিংস পরিবর্তন সংরক্ষণ করুন",
      utilityT: "ডাটাবেজ পরিষ্কার এবং ডেমো ডাটা সিডিং",
      utilityDesc: "সার্ভিস রিপোর্টের সমস্ত মেমোরি পরিষ্কার করে ফ্যাক্টরি অবস্তায় পুনরায় সেট করুন",
      resetBtn: "ডাটাবেজ সম্পূর্ণ মুছে ফেলুন",
      seedBtn: "নতুন ডেমো ডিক্লেয়ারড রিপোর্ট যুক্ত করুন",
      alertWipe: "সতর্কতা: ডাটাবেজ মুছে ফেললে তা আর ফেরত আনা সম্ভব নয়!",
      successSaved: "আইডেন্টিটি এবং পাসওয়ার্ড সফলভাবে সংরক্ষিত করা হয়েছে!",
      successReset: "ডাটাবেজ সফলভাবে মুছে ফেলা হয়েছে এবং ফ্যাক্টরি রিসেট সম্পন্ন হয়েছে!",
      successSeeded: "ডেমো ডাটা সফলভাবে ডাটাবেজে যুক্ত করা হয়েছে!",
      rulesTitle: "সংযুক্ত আরব আমিরাত স্বাস্থ্য স্ট্যান্ডার্ডস বিধি (MOHAP)",
      ruleDesc: "মেডিকেল এড়িয়া ও অপারেশন থিয়েটারে ব্যবহৃত সমস্ত স্প্রে রাসায়নিক ডাইলিউশন অনুপাত ১:১০০ এবং নিরাপদ অর্গানিক উপাদানে গঠিত হতে হবে।",
      securityT: "ERP সিকিউরিটি ও পাসওয়ার্ড লক সেটিংস",
      securityDesc: "এই ইআরপি ওয়েবসাইটে প্রবেশ করার সিকিউর পাসওয়ার্ড এখান থেকে পরিবর্তন করতে পারবেন।",
      passwordLabel: "সিস্টেমে প্রবেশের মূল পাসওয়ার্ড (ডিফল্ট পাসওয়ার্ড: 123456)"
    },
    ar: {
      title: "لوحة التحكم الإدارية والإعدادات تالجهة",
      subtitle: "تخصيص الهوية التجارية للنظام وتكوين ملف المدير المعتمد للتوقيعات الرسمية للأدوية والتقارير",
      brandingT: "إعدادات الهوية التجارية وشعار النظام",
      brandingSub: "تحديد المظهر والاسم التجاري المعروض على رأس التقارير والوثائق المطبوعة",
      companyLabel: "اسم الشركة الرئيسي (العلامة التجارية)",
      subtitleLabel: "العنوان الفرعي / إصدار البرنامج والتحكم",
      profileT: "ملف تعريف المشرف المسؤول",
      profileDesc: "إعداد معلومات الحساب المعتمد لتوقيع المستندات والتراخيص الطبية",
      usernameLabel: "اسم المدير المسؤول الرئيسي",
      emailLabel: "بريد إرسال الإشعارات والتقارير المعتمد",
      avatarLabel: "رابط الصورة الرمزية ديجيتال (اختياري)",
      saveAll: "حفظ وتطبيق معلمات التكوين",
      utilityT: "استعادة معالجة قاعدة البيانات",
      utilityDesc: "تصفير ذاكرة التخزين المؤقتة واستعادة الإعدادات الأولية للنظام والتقارير",
      resetBtn: "إعادة ضبط المصنع الكامل وقرصنة الذاكرة",
      seedBtn: "تثبيت تقارير الفحص والتعقيم التجريبية",
      alertWipe: "تحذير: لا يمكن التراجع عن تصفير قاعدة البيانات بعد تنفيذ العملية.",
      successSaved: "تمت مأمنة وحفظ معلمات الهوية والبروفايل بنجاح!",
      successReset: "تم مسح وإعادة قاعدة البيانات لخيارات المصنع بنجاح!",
      successSeeded: "تم ربط وتغذية البيانات المرجعية للتقارير الطبية بنجاح!",
      rulesTitle: "تشريعات وزارة الصحة ومعايير مكافحة الآفات",
      ruleDesc: "يلزم استخدام مادة الصيدلية والتعقيم البيئي بتركيز خفيف 1:100 المعتمدة رسمياً.",
      securityT: "أمان النظام وقفل كلمة المرور",
      securityDesc: "تكوين قفل المرور للدخول لمنع فتح النظام من غير المصرح لهم.",
      passwordLabel: "رقم المرور النشط الحالي (الإفتراضي هو 123456)"
    }
  }[language];

  const handleSaveParams = () => {
    setCompanyBrand(localBrand);
    setCompanySubtitle(localSubtitle);
    setProfileUser(localUser);
    setProfileEmail(localEmail);
    setProfileAvatarUrl(localAvatar);
    setAppPassword(localPassword || "123456");
    
    // Save to localStorage immediately
    localStorage.setItem("ALW_STAR_COMPANY_BRAND", localBrand);
    localStorage.setItem("ALW_STAR_COMPANY_SUBTITLE", localSubtitle);
    localStorage.setItem("ALW_STAR_PROFILE_USER", localUser);
    localStorage.setItem("ALW_STAR_PROFILE_EMAIL", localEmail);
    localStorage.setItem("ALW_STAR_PROFILE_AVATAR", localAvatar);
    localStorage.setItem("ALW_STAR_APP_PASSWORD", localPassword || "123456");

    // Always save to Firestore explicitly so all devices sync in real-time
    const localPayload = {
      companyBrand: localBrand,
      companySubtitle: localSubtitle,
      profileUser: localUser,
      profileEmail: localEmail,
      profileAvatarUrl: localAvatar,
      appPassword: localPassword || "123456",
    };
    saveBrandingData(localPayload, true).catch((e) => console.warn("Firestore branding save failed:", e));

    // Always clear the customized status to ensure it saves globally and syncs on other devices
    localStorage.removeItem("ALW_STAR_PROFILE_CUSTOMIZED");
    setIsCustomProfile(false);

    setSuccessMsg(t.successSaved);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleHardReset = () => {
    setShowHardResetConfirm(true);
  };

  const handleSeedMockReports = async () => {
    try {
      const reportsList = await getDocuments<ReportItem>("serviceReports");
      if (reportsList.length > 0) {
        onUpdateReports(reportsList);
        localStorage.setItem("ALW_STARE_ERP_REPORTS", JSON.stringify(reportsList));
        setSuccessMsg(t.successSeeded);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert("Firestore serviceReports collection is empty. Fill the form to create reports or check your database.");
      }
    } catch(e) {
      alert("Firestore request error seeding database.");
    }
  };

  const handleExportDatabase = () => {
    try {
      const backupData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("ALW_") || key.startsWith("alwafa_") || key.startsWith("al-wafa-") || key.startsWith("store_"))) {
          const val = localStorage.getItem(key);
          if (val !== null) {
            backupData[key] = val;
          }
        }
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `AlWafaStar-ERP-Backup-${dStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccessMsg(language === "bn" ? "ডাটাবেজ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!" : "Database backup file downloaded successfully!");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e) {
      alert("Error exporting database: " + e);
    }
  };

  const handleImportDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const confirmMerge = window.confirm(
      language === "bn"
        ? "আপনি কি এই ফাইল(গুলি) রিস্টোর করতে চান? এটি আপনার বর্তমান ডাটায় কোনো ক্ষতি না করে নতুন রিপোর্ট ও তথ্যগুলোকে অটোমেটিকলি যুক্ত (Merge) করে দিবে।"
        : "Are you sure you want to import this file(s)? This will automatically merge newly found reports and registry entries with your current local database."
    );
    if (!confirmMerge) return;

    let totalServiceReportsImported = 0;
    let totalEngineeringReportsImported = 0;
    let totalLocationsImported = 0;
    let totalSupervisorsImported = 0;
    let totalRequisitionsImported = 0;
    let totalOtherKeysImported = 0;
    let filesProcessed = 0;

    const fileList = Array.from(files) as File[];

    const mergeArraysById = (existingList: any[], newList: any[]) => {
      const merged = [...existingList];
      newList.forEach(newItem => {
        if (!newItem || typeof newItem !== "object") return;
        const existingIndex = merged.findIndex(item => item && item.id === newItem.id);
        if (existingIndex > -1) {
          merged[existingIndex] = { ...merged[existingIndex], ...newItem };
        } else {
          merged.push(newItem);
        }
      });
      return merged;
    };

    const readAndProcessFile = (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const fileContent = e.target?.result as string;
            const parsed = JSON.parse(fileContent);
            if (!parsed || typeof parsed !== "object") {
              throw new Error("Invalid JSON structure");
            }

            // Case A: Is it a complete backup file mapping keys to strings/objects?
            const keys = Object.keys(parsed);
            const isBackupFile = keys.some(k => k.startsWith("ALW_") || k.startsWith("alwafa_") || k.startsWith("al-wafa-") || k.startsWith("store_"));

            if (isBackupFile) {
              // Iterate over all backup keys and merge them
              for (const [key, val] of Object.entries(parsed)) {
                let stringVal = "";
                let objectVal: any = null;

                if (typeof val === "string") {
                  stringVal = val;
                  try {
                    objectVal = JSON.parse(val);
                  } catch (e) {}
                } else {
                  objectVal = val;
                  stringVal = JSON.stringify(val);
                }

                const existingRaw = localStorage.getItem(key);
                if (existingRaw) {
                  let existingObj: any = null;
                  try {
                    existingObj = JSON.parse(existingRaw);
                  } catch (e) {}

                  if (Array.isArray(existingObj) && Array.isArray(objectVal)) {
                    const merged = mergeArraysById(existingObj, objectVal);
                    localStorage.setItem(key, JSON.stringify(merged));
                    
                    const countDiff = merged.length - existingObj.length;
                    if (key === "ALW_STARE_ERP_REPORTS") totalServiceReportsImported += Math.max(0, countDiff);
                    else if (key === "ALW_ENGINEERING_REPORTS") totalEngineeringReportsImported += Math.max(0, countDiff);
                    else if (key === "ALW_LOCATIONS_REGISTRY") totalLocationsImported += Math.max(0, countDiff);
                    else if (key === "ALW_SUPERVISORS_REGISTRY") totalSupervisorsImported += Math.max(0, countDiff);
                    else if (key === "ALW_STAR_SAVED_REQUISITIONS") totalRequisitionsImported += Math.max(0, countDiff);
                    else totalOtherKeysImported++;
                  } else {
                    localStorage.setItem(key, stringVal);
                    totalOtherKeysImported++;
                  }
                } else {
                  localStorage.setItem(key, stringVal);
                  if (Array.isArray(objectVal)) {
                    if (key === "ALW_STARE_ERP_REPORTS") totalServiceReportsImported += objectVal.length;
                    else if (key === "ALW_ENGINEERING_REPORTS") totalEngineeringReportsImported += objectVal.length;
                    else if (key === "ALW_LOCATIONS_REGISTRY") totalLocationsImported += objectVal.length;
                    else if (key === "ALW_SUPERVISORS_REGISTRY") totalSupervisorsImported += objectVal.length;
                    else if (key === "ALW_STAR_SAVED_REQUISITIONS") totalRequisitionsImported += objectVal.length;
                    else totalOtherKeysImported++;
                  } else {
                    totalOtherKeysImported++;
                  }
                }
              }
            } else {
              // Case B or C: Raw array of items or a single item (reports, locations, etc.)
              const items = Array.isArray(parsed) ? parsed : [parsed];
              if (items.length > 0) {
                const firstItem = items[0];
                if (firstItem && typeof firstItem === "object") {
                  let targetKey = "";
                  
                  if (
                    "engineerName" in firstItem ||
                    "reportTitle" in firstItem ||
                    "workDetails" in firstItem ||
                    "rawEngineeringData" in firstItem ||
                    "ventilationType" in firstItem ||
                    "systemType" in firstItem
                  ) {
                    targetKey = "ALW_ENGINEERING_REPORTS";
                  } else if (
                    "facilityName" in firstItem ||
                    "clientId" in firstItem ||
                    "dateOfOperation" in firstItem ||
                    "contractNo" in firstItem ||
                    "pestType" in firstItem
                  ) {
                    targetKey = "ALW_STARE_ERP_REPORTS";
                  } else if ("locationName" in firstItem || "emirate" in firstItem) {
                    targetKey = "ALW_LOCATIONS_REGISTRY";
                  } else if ("supervisorName" in firstItem || ("role" in firstItem && "phone" in firstItem)) {
                    targetKey = "ALW_SUPERVISORS_REGISTRY";
                  } else if ("requisitionNo" in firstItem || "requestedChemicals" in firstItem) {
                    targetKey = "ALW_STAR_SAVED_REQUISITIONS";
                  } else {
                    if ("clientName" in firstItem && "reportNo" in firstItem) {
                      targetKey = "ALW_ENGINEERING_REPORTS";
                    } else if ("id" in firstItem) {
                      targetKey = "ALW_STARE_ERP_REPORTS";
                    }
                  }

                  if (targetKey) {
                    const existingRaw = localStorage.getItem(targetKey);
                    let existingObj: any[] = [];
                    if (existingRaw) {
                      try {
                        existingObj = JSON.parse(existingRaw);
                      } catch (e) {}
                    }
                    if (!Array.isArray(existingObj)) existingObj = [];

                    const merged = mergeArraysById(existingObj, items);
                    localStorage.setItem(targetKey, JSON.stringify(merged));

                    const countDiff = merged.length - existingObj.length;
                    if (targetKey === "ALW_STARE_ERP_REPORTS") totalServiceReportsImported += Math.max(0, countDiff);
                    else if (targetKey === "ALW_ENGINEERING_REPORTS") totalEngineeringReportsImported += Math.max(0, countDiff);
                    else if (targetKey === "ALW_LOCATIONS_REGISTRY") totalLocationsImported += Math.max(0, countDiff);
                    else if (targetKey === "ALW_SUPERVISORS_REGISTRY") totalSupervisorsImported += Math.max(0, countDiff);
                    else if (targetKey === "ALW_STAR_SAVED_REQUISITIONS") totalRequisitionsImported += Math.max(0, countDiff);
                  } else {
                    throw new Error("Could not determine report type for raw JSON");
                  }
                }
              }
            }

            filesProcessed++;
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (e) => reject(new Error("File reading error"));
        reader.readAsText(file);
      });
    };

    try {
      await Promise.all(fileList.map(file => readAndProcessFile(file)));

      try {
        const freshReports = localStorage.getItem("ALW_STARE_ERP_REPORTS");
        if (freshReports) {
          onUpdateReports(JSON.parse(freshReports));
        }
      } catch (e) {}

      window.dispatchEvent(new Event("storage"));

      const summaryMsg = language === "bn"
        ? `সফলভাবে ${filesProcessed}টি ফাইল প্রসেস করা হয়েছে! 
🎉 মোট নতুন যুক্ত/হালনাগাদ করা হয়েছে:
• সার্ভিস রিপোর্ট: ${totalServiceReportsImported}টি
• ইঞ্জিনিয়ারিং রিপোর্ট: ${totalEngineeringReportsImported}টি
• লোকেশন: ${totalLocationsImported}টি
• সুপারভাইজার: ${totalSupervisorsImported}টি
• কেমিক্যাল চাহিদাপত্র: ${totalRequisitionsImported}টি
• অন্যান্য সেটিংস: ${totalOtherKeysImported}টি

পেজটি স্বয়ংক্রিয়ভাবে রিলোড হচ্ছে...`
        : `Successfully processed ${filesProcessed} file(s)!
🎉 Total newly added/updated items:
• Service Reports: ${totalServiceReportsImported}
• Engineering Reports: ${totalEngineeringReportsImported}
• Registered Locations: ${totalLocationsImported}
• Supervisors: ${totalSupervisorsImported}
• Requisitions: ${totalRequisitionsImported}
• Other Settings: ${totalOtherKeysImported}

Reloading portal to apply updates...`;

      alert(summaryMsg);
      setSuccessMsg(language === "bn" ? "ডাটাবেজ সফলভাবে রিস্টোর হয়েছে!" : "Database successfully restored!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err: any) {
      alert(language === "bn" 
        ? "ফাইল রিস্টোর করতে সমস্যা হয়েছে। দয়া করে সঠিক JSON ব্যাকআপ ফাইল আপলোড করুন। ভুল: " + (err.message || err)
        : "Error processing one or more files. Please ensure you are uploading valid JSON reports or backup files. Details: " + (err.message || err)
      );
    }
  };

  const getRequisitionsCount = () => {
    try {
      const raw = localStorage.getItem("ALW_STAR_SAVED_REQUISITIONS");
      if (raw) {
        return JSON.parse(raw).length;
      }
    } catch(e) {}
    return 0;
  };

  const getLocationsCount = () => {
    try {
      const raw = localStorage.getItem("ALW_LOCATIONS_REGISTRY");
      if (raw) {
        return JSON.parse(raw).length;
      }
    } catch(e) {}
    return 0;
  };

  const getSupervisorsCount = () => {
    try {
      const raw = localStorage.getItem("ALW_SUPERVISORS_REGISTRY");
      if (raw) {
        return JSON.parse(raw).length;
      }
    } catch(e) {}
    return 0;
  };

  const getEngineeringReportsCount = () => {
    try {
      const raw = localStorage.getItem("ALW_ENGINEERING_REPORTS");
      if (raw) {
        return JSON.parse(raw).length;
      }
    } catch(e) {}
    return 0;
  };

  return (
    <div id="admin-settings-section-container" className="space-y-6 pb-12 font-sans text-xs">
      
      {/* Settings Top Header Layout */}
      <div className="bg-[#1E293B]/60 border border-[#334155] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-[#10B981] rounded-2xl border border-emerald-500/20">
            <Sliders className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>{t.title}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Alert notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 text-[#10B981] rounded-2xl flex items-center gap-2.5 font-bold animate-bounce">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2-Column Dashboard Layout (Facebook/Cloud Platform Style) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Professional Settings Directory (Sidebar) */}
        <div className="col-span-4 space-y-4 min-w-0">
          
          {/* Active Superintendent Mini-Profile Card */}
          <div className="bg-[#192333]/70 border border-[#334155]/60 rounded-3xl p-4 shadow-xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className="relative">
                {profileAvatarUrl ? (
                  <img 
                    src={profileAvatarUrl} 
                    alt="Current Operator" 
                    className="w-11 h-11 rounded-full border border-emerald-500/30 object-cover shadow bg-slate-950" 
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-950 border border-slate-705 flex items-center justify-center text-slate-400 font-bold">
                    {profileUser ? profileUser.substring(0, 2).toUpperCase() : "AD"}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border border-[#1E293B] rounded-full animate-pulse" />
              </div>
              <div className="text-left font-sans min-w-0 flex-1">
                <span className="block text-[9px] font-black uppercase tracking-wider text-[#10B981] font-mono leading-none">
                  Logged Operator
                </span>
                <span className="block text-xs font-black text-slate-100 truncate mt-1">
                  {profileUser || "Superintendent"}
                </span>
                <span className="block text-[10px] text-slate-450 truncate lowercase">
                  {profileEmail || "admin@starpest.ae"}
                </span>
              </div>
            </div>

            {/* Quick Badges display */}
            <div className="flex items-center justify-between text-[9px] bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-805/60 leading-none">
              <span className="text-slate-400 font-mono">Role:</span>
              <span className="text-emerald-400 font-black uppercase font-mono">
                {loggedInUser?.role || "Admin"}
              </span>
            </div>
          </div>

          {/* Settings Sidebar list */}
          <div className="bg-[#1E293B]/40 lg:bg-[#1E293B]/20 border border-[#334155]/50 rounded-3xl p-2.5 shadow-xl space-y-1">
            <div className="px-3.5 py-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                {language === "bn" ? "সেটিংস ডিরেক্টরি" : language === "ar" ? "قائمة الإعدادات" : "Settings Categories"}
              </h3>
            </div>
            
            {[
              { 
                id: "profile", 
                label: language === "bn" ? "প্রোফাইল ও দায়িত্ব" : "Profile & Roles", 
                sub: language === "bn" ? "অপারেটর আইডি ও দায়িত্ব স্তর" : "Identity & system privilege level",
                icon: <User className="w-4 h-4" />, 
                color: "text-blue-400 bg-blue-400/5",
                activeColor: "border-blue-500 text-blue-300"
              },
              { 
                id: "appearance", 
                label: language === "bn" ? "ডিজাইন ও ব্র্যান্ডিং" : "ERP Design & Colors",
                sub: language === "bn" ? "কোম্পানি লোগো, থিম ও স্ক্রিন সাইজ" : "System brand label, color schemes", 
                icon: <Sliders className="w-4 h-4" />,
                color: "text-emerald-400 bg-emerald-400/5",
                activeColor: "border-emerald-500 text-emerald-300"
              },
              { 
                id: "security", 
                label: language === "bn" ? "নিরাপত্তা ও ব্যবহারকারীগণ" : "Access Security & Users", 
                sub: language === "bn" ? "পিন কোড ও মাল্টি-ইউজার পারমিশন" : "System entrance PIN & users list",
                icon: <ShieldAlert className="w-4 h-4" />,
                color: "text-amber-400 bg-amber-400/5",
                activeColor: "border-amber-500 text-amber-300"
              },
              { 
                id: "password_security", 
                label: language === "bn" ? "পাসওয়ার্ড ও রিকভারি" : "Password & Session Logs", 
                sub: language === "bn" ? "পাসওয়ার্ড রোটেশন ও ২-ফ্যাক্টর শিল্ড" : "Keys rotation, recovery phone & 2FA",
                icon: <Lock className="w-4 h-4" />,
                color: "text-red-400 bg-red-400/5",
                activeColor: "border-red-500 text-red-300"
              },
              { 
                id: "role_permissions", 
                label: language === "bn" ? "রোল পারমিশন" : "Role Permissions", 
                sub: language === "bn" ? "মডারেটর ও ভিজিটর অ্যাক্সেস" : "Moderator & Visitor Access Control",
                icon: <ShieldAlert className="w-4 h-4" />,
                color: "text-indigo-400 bg-indigo-400/5",
                activeColor: "border-indigo-500 text-indigo-300"
              },
              { 
                id: "active_devices", 
                label: language === "bn" ? "লগইন সেশন" : "Active Sessions", 
                sub: language === "bn" ? "লগইন করা ডিভাইসের তালিকা" : "List of logged-in devices",
                icon: <Smartphone className="w-4 h-4" />,
                color: "text-cyan-400 bg-cyan-400/5",
                activeColor: "border-cyan-500 text-cyan-300"
              },
              { 
                id: "database", 
                label: language === "bn" ? "ডাটাবেজ ও MOHAP স্ট্যান্ডার্ড" : "Database & Standards", 
                sub: language === "bn" ? "ডাটা রিসেট ও হেলথ স্ট্যান্ডার্ড" : "Restore backups & legal rules",
                icon: <Database className="w-4 h-4" />,
                color: "text-fuchsia-400 bg-fuchsia-400/5",
                activeColor: "border-fuchsia-500 text-fuchsia-300"
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all relative cursor-pointer select-none ${
                    isActive
                      ? "bg-slate-900 border-l-4 border-emerald-500 text-slate-100 shadow-inner"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${tab.color} shrink-0 mt-0.5`}>
                    {tab.icon}
                  </div>
                  <div className="min-w-0 flex-1 leading-tight text-left">
                    <span className="block text-[11.5px] font-extrabold text-slate-100 truncate">
                      {tab.label}
                    </span>
                    <span className="block text-[9.5px] text-slate-500 truncate mt-0.5">
                      {tab.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* System status details box */}
          <div className="bg-slate-950/25 border border-slate-850/40 rounded-3xl p-4 text-left space-y-2 hidden lg:block leading-relaxed">
            <span className="block text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">
              ⚡ Connected Endpoint
            </span>
            <p className="text-[9.5px] text-slate-400 leading-normal">
              {language === "bn"
                ? "লোকাল সিকিউর গেটওয়ে এবং রিয়েল-টাইম ডাটাবেজ সিঙ্ক সচল আছে।"
                : "Local secure gateway and real-time cloud sync are active."}
            </p>
          </div>

          {/* Accent Palette Option selector */}
          <div className="space-y-3 bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
            <label className="text-[11px] font-bold text-slate-350 uppercase tracking-wider block">
              ✨ {language === "bn" ? "২. অ্যাকসেন্ট কালার প্যালেট" : "2. COLOR PALETTE"}
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { id: "emerald", hex: "#2DD4BF", name: "Mint", label: language === "bn" ? "মিন্ট" : "Mint" },
                { id: "amber", hex: "#FBBF24", name: "Amber", label: language === "bn" ? "অ্যাম্বার" : "Amber" },
                { id: "sky", hex: "#38BDF8", name: "Sky", label: language === "bn" ? "আকাশি" : "Sky" },
                { id: "rose", hex: "#FB7185", name: "Blush", label: language === "bn" ? "ব্লাশ" : "Blush" },
                { id: "crimson", hex: "#F43F5E", name: "Crimson", label: language === "bn" ? "লাল" : "Crimson" },
                { id: "indigo", hex: "#818CF8", name: "Indigo", label: language === "bn" ? "নীল" : "Indigo" },
                { id: "violet", hex: "#A78BFA", name: "Lavender", label: language === "bn" ? "ল্যাভেন্ডার" : "Lavender" },
                { id: "orange", hex: "#FB923C", name: "Orange", label: language === "bn" ? "কমলা" : "Orange" },
                { id: "gold", hex: "#FACC15", name: "Gold", label: language === "bn" ? "স্বর্ণালী" : "Gold" },
                { id: "fuchsia", hex: "#E879F9", name: "Fuchsia", label: language === "bn" ? "ফিউশিয়" : "Fuchsia" },
                { id: "turquoise", hex: "#22D3EE", name: "Turquoise", label: language === "bn" ? "টার্কিশ" : "Turquoise" },
                { id: "lime", hex: "#A3E635", name: "Lime", label: language === "bn" ? "লেবু সবুজ" : "Lime" },
                { id: "sapphire", hex: "#60A5FA", name: "Sapphire", label: language === "bn" ? "রাজকীয় নীল" : "Sapphire" },
                { id: "magenta", hex: "#F472B6", name: "Magenta", label: language === "bn" ? "ম্যাজেন্টা" : "Magenta" },
                { id: "forest", hex: "#4ADE80", name: "Forest", label: language === "bn" ? "বন সবুজ" : "Forest" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.name}
                  onClick={() => setThemeColor(c.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                    themeColor === c.id
                      ? "bg-slate-900 border-slate-700"
                      : "border-slate-800 bg-slate-900/40 text-slate-450 hover:text-slate-200"
                  }`}
                  style={themeColor === c.id ? { borderColor: c.hex, color: c.hex, backgroundColor: `${c.hex}22` } : {}}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0`} style={{ backgroundColor: c.hex }} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Screen Size Layout toggler (Fullscreen vs Window/Half Mode) */}
          <div className="space-y-3 bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
            <label className="text-[11px] font-bold text-slate-350 uppercase tracking-wider block">
              🖥️ {language === "bn" ? "৩. স্ক্রিন ডিসপ্লে লেআউট" : "3. SCREEN LAYOUT"}
            </label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => onSetFullscreenLayout?.(false)}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                  !isFullscreenLayout
                    ? "bg-[#10B981] text-slate-950 font-black shadow-lg"
                    : "bg-slate-900 border border-slate-800 text-slate-450 hover:text-slate-100 hover:border-slate-700"
                }`}
                title={language === "bn" ? "সাইডবার এবং হেডার সহ সাধারণ লেআউট" : "Window mode with header and menu sidebar"}
              >
                <span>🖥️</span>
                <span>{language === "bn" ? "হাফ স্ক্রিন" : "Windowed"}</span>
              </button>
              <button
                type="button"
                onClick={() => onSetFullscreenLayout?.(true)}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                  isFullscreenLayout
                    ? "bg-[#10B981] text-slate-950 font-black shadow-lg"
                    : "bg-slate-900 border border-slate-800 text-slate-450 hover:text-slate-100 hover:border-slate-700"
                }`}
                title={language === "bn" ? "সাইডবার এবং হেডার ছাড়া ফুল-স্ক্রিন মোড" : "Fullscreen layout with maximized canvas width"}
              >
                <span>📺</span>
                <span>{language === "bn" ? "ফুল স্ক্রিন" : "Full Screen"}</span>
              </button>
            </div>
          </div>
        </div>

      {/* Right Side Settings Details Panel */}
      <div className="col-span-8 space-y-6 min-w-0">

        {/* First section of Appearance Tab (Branding parameters) */}
        <div className={activeTab === "appearance" ? "space-y-6 block animate-fade-in" : "hidden"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Item 1: ERP Branding Setup */}
            <div className="bg-[#1E293B]/40 border border-[#334155] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Building className="w-4 h-4 text-[#10B981]" />
                  <span>{t.brandingT}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t.brandingSub}
                </p>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">{t.companyLabel}</label>
                    <input 
                      type="text"
                      value={localBrand}
                      onChange={(e) => setLocalBrand(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-xl py-2 px-3 text-xs outline-none focus:border-[#10B981]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold block">{t.subtitleLabel}</label>
                    <input 
                      type="text"
                      value={localSubtitle}
                      onChange={(e) => setLocalSubtitle(e.target.value)}
                      className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-xl py-2 px-3 text-xs outline-none focus:border-[#10B981]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSaveParams}
                  className="w-full bg-[#10B981] hover:bg-emerald-400 text-slate-950 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.saveAll}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

      {/* ===================== TAB: PROFILE ===================== */}
      <div className={activeTab === "profile" ? "space-y-6 block animate-fade-in" : "hidden"}>

        {/* Item 2: Superintendent identity Profile */}
        <div className="bg-[#1E293B]/40 border border-[#334155] rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-emerald-450" />
              <span>{t.profileT}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {t.profileDesc}
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">{t.usernameLabel}</label>
                <input 
                  type="text"
                  value={localUser}
                  onChange={(e) => setLocalUser(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-xl py-2 px-3 text-xs outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">{t.emailLabel}</label>
                <input 
                  type="email"
                  value={localEmail}
                  onChange={(e) => setLocalEmail(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-xl py-2 px-3 text-xs outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">{t.avatarLabel}</label>
                <input 
                  type="text"
                  placeholder="Paste URL link e.g. https://images.unsplash.com..."
                  value={localAvatar}
                  onChange={(e) => setLocalAvatar(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-700 rounded-xl py-2 px-3 text-xs outline-none focus:border-[#10B981]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSaveParams}
              className="w-full bg-[#10B981] hover:bg-emerald-400 text-slate-950 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{t.saveAll}</span>
            </button>
          </div>
        </div>
        {/* Superintendent Active Visual Card */}
        <div className="flex items-center gap-4 bg-slate-950/20 p-4 border border-slate-800 rounded-2xl">
          <div className="relative">
            {profileAvatarUrl ? (
              <img 
                src={profileAvatarUrl} 
                className="w-16 h-16 rounded-full border border-emerald-500/20 object-cover shadow bg-slate-950" 
                alt="Profile Avatar"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 font-bold text-lg">
                {profileUser ? profileUser.substring(0, 2).toUpperCase() : "AD"}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#10B981] border-2 border-[#1E293B] rounded-full" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100 tracking-tight">
              {profileUser}
            </h3>
            <p className="text-xs text-slate-400 tracking-wide lowercase mt-0.5">
              {profileEmail}
            </p>
          </div>
        </div>
        
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full md:w-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-3 px-6 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer hover:text-white"
            title="Lock Suite & Profile Log out"
          >
            <span>🚪</span>
            <span>{language === "bn" ? "লগ আউট / লক স্যুইট" : language === "ar" ? "تسجيل الخروج / قفل" : "Log Out / Lock Suite"}</span>
          </button>
        )}

      {/* Operational Profile Role Switcher */}
      {role && setRole && loggedInUser && (
        <div className="bg-[#1E293B]/60 border border-[#334155] rounded-3xl p-6 shadow-xl relative mt-6">
          <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-2">
            OPERATIONAL PROFILE
          </label>
          <div className="relative">
            <button
              onClick={() => {
                if (loggedInUser?.role === "Admin") {
                  setShowRoleMenu(!showRoleMenu);
                }
              }}
              disabled={loggedInUser?.role !== "Admin"}
              className={`w-full max-w-sm bg-slate-800 ${loggedInUser?.role === "Admin" ? "hover:bg-slate-700 cursor-pointer" : "opacity-80"} border border-slate-700/50 text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-200 transition-all flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  role === "Super Admin" ? "bg-red-500" :
                  role === "Admin / Manager" ? "bg-blue-400" :
                  role === "Guest Admin" ? "bg-yellow-400" : "bg-teal-400"
                }`} />
                <span>{role} ({loggedInUser?.role ? (language === "bn" ? (loggedInUser.role === "Admin" ? "অ্যাডমিন" : loggedInUser.role === "Moderator" ? "মডারেটর" : "ভিজিটর") : loggedInUser.role) : "Admin"})</span>
              </div>
              {loggedInUser?.role === "Admin" && (
                <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-2 py-1 rounded cursor-pointer">
                  Switch
                </span>
              )}
            </button>

            {showRoleMenu && loggedInUser?.role === "Admin" && (
              <div className="absolute left-0 top-full mt-2 w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 divide-y divide-slate-700/50">
                {(["Super Admin", "Admin / Manager", "Guest Admin", "Client Portal"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-700/60 transition-colors ${
                      role === r ? "bg-[#10B981]/10 text-[#10B981]" : "text-slate-300"
                    }`}
                  >
                    <span>{r}</span>
                    {role === r && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* ===================== TAB: APPEARANCE ===================== */}
      <div className={activeTab === "appearance" ? "space-y-6 block animate-fade-in" : "hidden"}>

      {/* 🔮 CUSTOM THEME MODE & ACCENT COLOR SCHEME SELECTOR */}
      <div className="bg-[#1E293B]/60 border border-[#334155] rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <span className="text-sm">🎨</span>
            <span>
              {language === "bn" ? "সistem মোড, কাস্টম কালার থিম এবং স্কিন সাইজ" : "Display Mode, Accent Colors & Screen Sizes"}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            {language === "bn"
              ? "আপনার পছন্দ অনুযায়ী ডার্ক/লাইট মোড সিলেক্ট করুন, অ্যাকসেন্ট কালার বেছে নিন এবং ফুল-স্ক্রিন বা সাধারণ উইন্ডো সাইজ নির্ধারণ করুন।"
              : "Choose dark/light display mode, select custom accent color styles and toggle full screen/windowed modes instantly."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          {/* Theme Mode Option selector */}
          <div className="space-y-3 bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
            <label className="text-[11px] font-bold text-slate-350 uppercase tracking-wider block">
              💻 {language === "bn" ? "১. ডিসপ্লে মোড" : "1. DISPLAY MODE"}
            </label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setThemeMode("dark")}
                className={`py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors duration-200 cursor-pointer ${
                  themeMode === "dark"
                    ? "bg-[#10B981] text-slate-950 font-black"
                    : "bg-slate-900 border border-slate-800 text-slate-450 hover:text-white"
                }`}
              >
                <span>🌙</span>
                <span>{language === "bn" ? "ডার্ক মোড" : "Dark Mode"}</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode("light")}
                className={`py-2 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors duration-200 cursor-pointer ${
                  themeMode === "light"
                    ? "bg-[#10B981] text-slate-950 font-black"
                    : "bg-slate-900 border border-slate-800 text-slate-450 hover:text-white"
                }`}
              >
                <span>☀️</span>
                <span>{language === "bn" ? "লাইট মোড" : "Light Mode"}</span>
              </button>
            </div>
          </div>

          {/* Accent Palette Option selector */}
          <div className="space-y-3 bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
            <label className="text-[11px] font-bold text-slate-350 uppercase tracking-wider block">
              ✨ {language === "bn" ? "২. অ্যাকসেন্ট কালার প্যালেট" : "2. COLOR PALETTE"}
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { id: "emerald", hex: "#2DD4BF", name: "Mint", label: language === "bn" ? "মিন্ট" : "Mint" },
                { id: "amber", hex: "#FBBF24", name: "Amber", label: language === "bn" ? "অ্যাম্বার" : "Amber" },
                { id: "sky", hex: "#38BDF8", name: "Sky", label: language === "bn" ? "আকাশি" : "Sky" },
                { id: "rose", hex: "#FB7185", name: "Blush", label: language === "bn" ? "ব্লাশ" : "Blush" },
                { id: "crimson", hex: "#F43F5E", name: "Crimson", label: language === "bn" ? "লাল" : "Crimson" },
                { id: "indigo", hex: "#818CF8", name: "Indigo", label: language === "bn" ? "নীল" : "Indigo" },
                { id: "violet", hex: "#A78BFA", name: "Lavender", label: language === "bn" ? "ল্যাভেন্ডার" : "Lavender" },
                { id: "orange", hex: "#FB923C", name: "Orange", label: language === "bn" ? "কমলা" : "Orange" },
                { id: "gold", hex: "#FACC15", name: "Gold", label: language === "bn" ? "স্বর্ণালী" : "Gold" },
                { id: "fuchsia", hex: "#E879F9", name: "Fuchsia", label: language === "bn" ? "ফিউশিয়" : "Fuchsia" },
                { id: "turquoise", hex: "#22D3EE", name: "Turquoise", label: language === "bn" ? "টার্কিশ" : "Turquoise" },
                { id: "lime", hex: "#A3E635", name: "Lime", label: language === "bn" ? "লেবু সবুজ" : "Lime" },
                { id: "sapphire", hex: "#60A5FA", name: "Sapphire", label: language === "bn" ? "রাজকীয় নীল" : "Sapphire" },
                { id: "magenta", hex: "#F472B6", name: "Magenta", label: language === "bn" ? "ম্যাজেন্টা" : "Magenta" },
                { id: "forest", hex: "#4ADE80", name: "Forest", label: language === "bn" ? "বন সবুজ" : "Forest" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.name}
                  onClick={() => setThemeColor(c.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                    themeColor === c.id
                      ? "bg-slate-900 border-slate-700"
                      : "border-slate-800 bg-slate-900/40 text-slate-450 hover:text-slate-200"
                  }`}
                  style={themeColor === c.id ? { borderColor: c.hex, color: c.hex, backgroundColor: `${c.hex}22` } : {}}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0`} style={{ backgroundColor: c.hex }} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Screen Size Layout toggler (Fullscreen vs Window/Half Mode) */}
          <div className="space-y-3 bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
            <label className="text-[11px] font-bold text-slate-350 uppercase tracking-wider block">
              🖥️ {language === "bn" ? "৩. স্ক্রিন ডিসপ্লে লেআউট" : "3. SCREEN LAYOUT"}
            </label>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => onSetFullscreenLayout?.(false)}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                  !isFullscreenLayout
                    ? "bg-[#10B981] text-slate-950 font-black shadow-lg"
                    : "bg-slate-900 border border-slate-800 text-slate-450 hover:text-slate-100 hover:border-slate-700"
                }`}
                title={language === "bn" ? "সাইডবার এবং হেডার সহ সাধারণ লেআউট" : "Window mode with header and menu sidebar"}
              >
                <span>🖥️</span>
                <span>{language === "bn" ? "হাফ স্ক্রিন" : "Windowed"}</span>
              </button>
              <button
                type="button"
                onClick={() => onSetFullscreenLayout?.(true)}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                  isFullscreenLayout
                    ? "bg-[#10B981] text-slate-950 font-black shadow-lg"
                    : "bg-slate-900 border border-slate-800 text-slate-450 hover:text-slate-100 hover:border-slate-700"
                }`}
                title={language === "bn" ? "সাইডবার এবং হেডার ছাড়া ফুল-স্ক্রিন মোড" : "Fullscreen layout with maximized canvas width"}
              >
                <span>📺</span>
                <span>{language === "bn" ? "ফুল স্ক্রিন" : "Full Screen"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div> {/* End Appearance Tab */}

      {/* ===================== TAB: SECURITY ===================== */}
      <div className={activeTab === "security" ? "space-y-6 block animate-fade-in" : "hidden"}>

        {/* Card 1: Admin General Password & System Access Lock */}
        <div className="bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-[#10B981] animate-pulse" />
                <span>
                  {language === "bn" ? "সিস্টেম সিকিউরিটি ও পাসওয়ার্ড নিয়ন্ত্রণ" : "System Security & Credentials Control"}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === "bn"
                  ? "সফটওয়্যারে প্রবেশাধিকার নিয়ন্ত্রণ এবং সিস্টেমে প্রধান এডমিন পাসওয়ার্ড এখান থেকে পরিবর্তন করুন।"
                  : "Enforce authorization check-ins and configure general operator passcodes from here."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Input 1: System entrance padlock */}
            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-slate-350">
                {language === "bn" ? "সফটওয়্যারে প্রবেশের মূল পিন/পাসওয়ার্ড" : "General Software Access Padlock"}
              </label>
              <div className="relative">
                <input
                  type={showSystemPass ? "text" : "password"}
                  value={localPassword}
                  onChange={(e) => setLocalPassword(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full bg-slate-950 text-slate-100 border border-slate-750 hover:border-slate-700 rounded-xl py-2.5 pl-3 pr-10 text-xs outline-none focus:border-[#10B981] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSystemPass(!showSystemPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showSystemPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[9.5px] text-slate-500">
                {language === "bn" ? "ডিফল্ট পিন হচ্ছে 123456। এটি সাধারণ ইউজার প্রবেশাধিকার নিয়ন্ত্রণ করে।" : "Default access PIN is 123456. Used for general application locking."}
              </p>
            </div>

            {/* Input 2: admin username password */}
            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-slate-350">
                {language === "bn" ? "প্রধান 'admin' অ্যাকাউন্টের পাসওয়ার্ড" : "Primary Administrator Sign-in Password"}
              </label>
              <div className="relative">
                <input
                  type={showAdminPass ? "text" : "password"}
                  value={adminUserPassword}
                  onChange={(e) => setAdminUserPassword(e.target.value)}
                  placeholder="e.g. admin123"
                  className="w-full bg-slate-950 text-slate-100 border border-slate-750 hover:border-slate-700 rounded-xl py-2.5 pl-3 pr-10 text-xs outline-none focus:border-[#10B981] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[9.5px] text-slate-500">
                {language === "bn" ? "এডমিন সেটিংসে অ্যাক্সেস পাওয়ার মূল চাবি। সুরক্ষার জন্য এটি জটিল রাখুন।" : "Controls administrative privileges. Default password is 'admin123'."}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={handleSaveSecurity}
              className="bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-black text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <Check className="w-4 h-4" />
              <span>{language === "bn" ? "সিকিউরিটি সেটিংস সেভ করুন" : "Save Security Configurations"}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Multi-User Access Controller */}
        <div id="multi-user-controller" className="bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-1.5">
            <h3 className="text-sm font-extrabold text-[#10B981] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#10B981]" />
              <span>
                {language === "bn" ? "ব্যবহারকারী অ্যাকাউন্ট ও অ্যাক্সেস পারমিশন কন্ট্রোল" : "Multi-User Access & Role Manager"}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {language === "bn" 
                ? "এখানে একজন ভিজিটর বা মডারেটরের জন্য আলাদা আলাদা পাসওয়ার্ড এবং ইউজারনেম তৈরি করতে পারবেন। অ্যাডমিন অ্যাকাউন্ট সবকিছু দেখতে ও সেটিংস এডিট করতে পারবে, মডারেটর এডিট করতে পারবে কিন্তু সেটিংসে যেতে পারবে না এবং ভিজিটর শুধু দেখতে পারবে (কোনো এডিট করতে পারবে না)।" 
                : "Generate personal login credentials for companions, moderators, and view-only visitors. Admin has full clearance, Moderator has form editing permissions, and Visitor operates strictly in Read-Only companion mode."}
            </p>
          </div>

          {/* Action alerts */}
          {userError && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-[10.5px] font-bold rounded-xl flex items-center gap-2 animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{userError}</span>
            </div>
          )}
          {userSuccess && (
            <div className="p-3 bg-emerald-950/20 border border-[#10B981]/20 text-[#10B981] text-[10.5px] font-bold rounded-xl flex items-center gap-2 animate-fade-in">
              <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
              <span>{userSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            
            {/* New User form segment */}
            <div className="lg:col-span-1 bg-slate-950/40 p-5 border border-slate-800 rounded-2xl space-y-4">
              <h4 className="text-xs font-black text-[#10B981] uppercase tracking-wider font-mono">
                {language === "bn" ? "নতুন অ্যাকাউন্ট যুক্ত করুন" : "Create Account"}
              </h4>

              <div className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-bold text-[10px]">
                    {language === "bn" ? "ইউজারনেম (ইংরেজিতে)" : "Username (Lowercase)"}
                  </label>
                  <input 
                    type="text" 
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. jamil_visitor"
                    className="w-full bg-slate-950 text-slate-100 border border-slate-750 hover:border-slate-700 rounded-xl py-2.5 px-3 text-xs outline-none focus:border-[#10B981] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-400 block font-bold text-[10px]">
                      {language === "bn" ? "গোপন পাসওয়ার্ড" : "Password"}
                    </label>
                    <button
                      type="button"
                      onClick={generateSecurePassword}
                      className="text-[9px] text-[#10B981] hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition font-mono font-extrabold"
                      title={language === "bn" ? "র্যান্ডম পাসওয়ার্ড তৈরি করুন" : "Generate secure password"}
                    >
                      <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                      <span>{language === "bn" ? "র্যান্ডম পাসওয়ার্ড" : "Auto Generate"}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="e.g. pass789"
                      className="w-full bg-slate-950 text-slate-100 border border-slate-750 hover:border-slate-700 rounded-xl py-2.5 pl-3 pr-10 text-xs outline-none focus:border-[#10B981] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength visualizer meter */}
                  {newPassword && (
                    <div className="space-y-1 pt-1.5 animate-fade-in text-left">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-slate-500">
                          {language === "bn" ? "পাসওয়ার্ডের ক্ষমতা স্তরের মান:" : "Credential Security Strength:"}
                        </span>
                        <span className="font-extrabold" style={{ color: getPasswordStrength(newPassword).color === "bg-red-500" ? "#EF4444" : getPasswordStrength(newPassword).color === "bg-amber-500" ? "#FBBF24" : "#10B981" }}>
                          {language === "bn" ? getPasswordStrength(newPassword).labelBn : getPasswordStrength(newPassword).label}
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 border border-slate-800 h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${getPasswordStrength(newPassword).color} ${getPasswordStrength(newPassword).width}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 block font-bold text-[10px]">
                    {language === "bn" ? "অ্যাকাউন্টের রোল / পারমিশন" : "Assigned System Role"}
                  </label>
                  
                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {[
                      { 
                        val: "Admin", 
                        title: language === "bn" ? "অ্যাডমিন (Admin)" : "Admin Role",
                        desc: language === "bn" ? "পূর্ণ নিয়ন্ত্রণ, সামগ্রিক ব্রান্ডিং ও ইউজার সেটিংস এডিটিং পারমিশন।" : "Full clearance: Edit configurations, systems branding, and account ledgers.",
                        color: "border-red-500/15 bg-red-950/10 hover:bg-slate-900 duration-200" 
                      },
                      { 
                        val: "Acting Leader", 
                        title: language === "bn" ? "অ্যাক্টিং লিডার (Acting Leader)" : "Acting Leader Role",
                        desc: language === "bn" ? "অ্যাক্টিং লিডার টিম কন্ট্রোল ও সার্ভিস ফাইল এডিটিং পারমিশন।" : "Acting Leader view: Manage operational files and complete service entries.",
                        color: "border-emerald-500/15 bg-emerald-950/10 hover:bg-slate-900 duration-200" 
                      },
                      { 
                        val: "Moderator", 
                        title: language === "bn" ? "মডারেটর (Moderator)" : "Moderator Role",
                        desc: language === "bn" ? "সার্ভিস ডিক্লারেশন রিপোর্ট, কেমিক্যাল ল্যাব ও অ্যাক্টিভিটি এডিট পারমিশন।" : "Staff view: Save, register and edit reports. Administrative tabs are locked.",
                        color: "border-blue-500/15 bg-blue-950/10 hover:bg-slate-900 duration-200" 
                      },
                      { 
                        val: "Visitor", 
                        title: language === "bn" ? "ভিজিটর (Visitor)" : "Visitor Role",
                        desc: language === "bn" ? "ক্যালকুলেটর ভিউয়ার ও রিড-অনলি মোড (কোনো ফাইল এডিট বা ডিলিট হবে না)।" : "Reviewer access: Strictly Read-Only. Cannot manipulate data logs or settings.",
                        color: "border-yellow-500/15 bg-yellow-950/10 hover:bg-slate-900 duration-200" 
                      }
                    ].map((opt) => {
                      const isSelected = newRole === opt.val;
                      return (
                        <div
                          key={opt.val}
                          onClick={() => setNewRole(opt.val as any)}
                          className={`border p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-2.5 select-none relative ${
                            isSelected 
                              ? "border-[#10B981] bg-[#10B981]/10 ring-1 ring-[#10B981]/25" 
                              : `${opt.color} border-slate-800`
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? "border-[#10B981] bg-[#10B981] text-slate-950" : "border-slate-700 bg-slate-900"
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[4.5]" />}
                          </div>
                          <div className="text-left space-y-0.5 leading-normal">
                            <p className={`font-black text-[10.5px] ${isSelected ? "text-emerald-400" : "text-slate-200"}`}>
                              {opt.title}
                            </p>
                            <p className="text-[9.5px] text-slate-455">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                  type="button"
                  onClick={handleAddUser}
                  className="w-full bg-[#10B981] hover:bg-emerald-400 text-slate-950 py-2.5 px-3 rounded-xl font-black text-xs transition flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 mt-4"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{language === "bn" ? "অ্যাকাউন্ট তৈরি করুন" : "Add Account"}</span>
                </button>
              </div>

            {/* Active Users Table/List segment */}
            <div className="lg:col-span-2 bg-slate-950/40 p-5 border border-slate-800 rounded-2xl space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-[#10B981]" />
                    <span>{language === "bn" ? "নিবন্ধিত অ্যাকাউন্ট সমূহ" : "Registered User Accounts List"}</span>
                  </h4>
                  <p className="text-[10px] text-slate-440">
                    {language === "bn" 
                      ? `সর্বমোট ${usersList.length} টি অ্যাকাউন্ট সংরক্ষিত আছে` 
                      : `${usersList.length} actively registered credentials`}
                  </p>
                </div>

                {/* Dynamic Live Filter input */}
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-455" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === "bn" ? "সার্চ ইউজার বা অ্যাক্সেস রোল..." : "Search user accounts or roles..."}
                    className="w-full bg-slate-950 text-slate-200 border border-slate-800 hover:border-slate-700/60 focus:border-[#10B981] rounded-xl pl-9 pr-3 py-1.5 text-[10.5px] outline-none transition"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-sans">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-450 font-mono text-left">
                      <th className="pb-2.5 font-bold text-left">{language === "bn" ? "ইউজারনেম" : "Username"}</th>
                      <th className="pb-2.5 font-bold text-left">{language === "bn" ? "পাসওয়ার্ড" : "Password"}</th>
                      <th className="pb-2.5 font-bold text-left">{language === "bn" ? "নির্ধারিত রোল" : "Assigned Role"}</th>
                      <th className="pb-2.5 font-bold text-center">{language === "bn" ? "অ্যাকশন" : "Action"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50">
                    {usersList.filter(u => {
                      const q = searchQuery.toLowerCase().trim();
                      return u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500 italic font-mono text-[10.5px]">
                          {language === "bn" ? "কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি!" : "No corresponding accounts matched your query."}
                        </td>
                      </tr>
                    ) : (
                      usersList.filter(u => {
                        const q = searchQuery.toLowerCase().trim();
                        return u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
                      }).map((user) => {
                        const isEditing = editingUserId === user.id;
                        const isPasswordVisible = !!editingPasswordVisibilities[user.id];
                        const isSystemRoot = user.username === "admin" || user.username === "hussainahmad13122@gmail.com";
                        
                        return (
                          <React.Fragment key={user.id}>
                            <tr className="hover:bg-slate-900/25 transition border-b border-slate-900/50">
                              <td className="py-3 font-mono font-bold text-slate-100 text-left">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                    user.role === "Admin" 
                                      ? "bg-red-500 shadow-md shadow-red-500/20" 
                                      : user.role === "Moderator" 
                                        ? "bg-blue-400 shadow-md shadow-blue-500/20" 
                                        : "bg-amber-400 shadow-md shadow-amber-500/20"
                                  }`} />
                                  <div className="text-left leading-tight">
                                    <span className="block text-[11.5px] text-slate-100">{user.username}</span>
                                    {isSystemRoot && (
                                      <span className="text-[8px] bg-red-500/10 text-red-400 font-extrabold uppercase px-1 rounded-sm border border-red-500/20">
                                        System Root
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="py-3 font-mono text-slate-300 font-bold tracking-wider text-left">
                                {isEditing ? (
                                  <div className="relative inline-block w-full max-w-[150px]">
                                    <input
                                      type={editingPasswordVisibilities[user.id] ? "text" : "password"}
                                      value={editingPassword}
                                      onChange={(e) => setEditingPassword(e.target.value)}
                                      className="bg-slate-950 text-emerald-400 border border-slate-750 focus:border-[#10B981] px-2.5 py-1.5 rounded-xl text-xs w-full font-mono outline-none pr-8"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibilityForUser(user.id)}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                                    >
                                      {editingPasswordVisibilities[user.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="bg-slate-950/60 px-2.5 py-1 rounded-xl font-mono text-[10.5px] border border-slate-850 text-slate-350 min-w-[70px] inline-block text-center font-bold">
                                      {isPasswordVisible ? user.passwordPlain : "••••••••"}
                                    </span>
                                    <button
                                      type="button"
                                      className="p-1 rounded bg-slate-905 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                                      onClick={() => togglePasswordVisibilityForUser(user.id)}
                                      title={isPasswordVisible ? "Hide password" : "Show password"}
                                    >
                                      {isPasswordVisible ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                                    </button>
                                  </div>
                                )}
                              </td>
                              
                              <td className="py-3 text-left">
                                {isEditing ? (
                                  <select
                                    value={editingRole}
                                    onChange={(e) => setEditingRole(e.target.value as any)}
                                    disabled={isSystemRoot}
                                    className="bg-slate-950 text-slate-200 border border-slate-750 focus:border-[#10B981] px-2 py-1.5 rounded-xl text-xs outline-none cursor-pointer"
                                  >
                                    <option value="Admin">{language === "bn" ? "অ্যাডমিন" : "Admin"}</option>
                                    <option value="Acting Leader">{language === "bn" ? "অ্যাক্টিং লিডার" : "Acting Leader"}</option>
                                    <option value="Moderator">{language === "bn" ? "মডারেটর" : "Moderator"}</option>
                                    <option value="Visitor">{language === "bn" ? "ভিজিটর" : "Visitor"}</option>
                                  </select>
                                ) : (
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-wide border inline-flex items-center gap-1 ${
                                    user.role === "Admin" 
                                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                                      : user.role === "Acting Leader"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : user.role === "Moderator" 
                                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                                          : "bg-yellow-500/10 text-yellow-550 border-yellow-550/20"
                                  }`}>
                                    {user.role === "Admin" 
                                      ? "🛡️ Admin" 
                                      : user.role === "Acting Leader"
                                        ? "🎖️ Acting Leader"
                                        : user.role === "Moderator" 
                                          ? "✍️ Moderator" 
                                          : "👁️ Visitor"}
                                  </span>
                                )}
                              </td>
                              
                              <td className="py-3 text-center">
                                {isEditing ? (
                                  <div className="flex gap-1.5 justify-center">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveUserEdit(user.id)}
                                      className="bg-[#10B981] hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-xl font-black text-[10px] cursor-pointer transition shadow-md shadow-emerald-500/10"
                                    >
                                      {language === "bn" ? "সেভ" : "Save"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEditingUser}
                                      className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1.5 rounded-xl font-bold text-[10px] cursor-pointer transition"
                                    >
                                      {language === "bn" ? "বাতিল" : "Cancel"}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex gap-1.5 justify-center items-center">
                                    <button
                                      type="button"
                                      onClick={() => startEditingUser(user)}
                                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                                      title={language === "bn" ? "পাসওয়ার্ড বা তথ্য পরিবর্তন করুন" : "Update user password"}
                                    >
                                      <span>⚙️</span>
                                      <span>{language === "bn" ? "এডিট" : "Edit"}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUser(user.id, user.username)}
                                      disabled={isSystemRoot}
                                      className={`p-1.5 rounded-xl border transition cursor-pointer inline-flex items-center justify-center ${
                                        isSystemRoot 
                                          ? "opacity-20 cursor-not-allowed border-slate-800 text-slate-600" 
                                          : "bg-red-500/10 hover:bg-red-500/25 border-red-500/15 text-red-400"
                                      }`}
                                      title={language === "bn" ? "অ্যাকাউন্ট মুছুন" : "Wipe credentials"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>

                            {isEditing && (
                              <tr className="bg-slate-950/20">
                                <td colSpan={4} className="p-4 border-b border-slate-850">
                                  <div className="space-y-4">
                                    {/* Toggle Custom Permissions */}
                                    <div className="flex items-center justify-between bg-slate-900/20 p-3 rounded-xl border border-slate-850">
                                      <div className="text-left leading-snug">
                                        <span className="block text-xs font-bold text-slate-200">
                                          ⚙️ {language === "bn" ? "কাস্টম পারমিশন সক্রিয় করুন" : "Enable Custom Permissions"}
                                        </span>
                                        <span className="text-[10px] text-slate-450">
                                          {language === "bn" ? "বেস রোলের পরিবর্তে নিজস্ব পারমিশন সেট করুন" : "Override default role permissions for this user"}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setEditingCustomPermissionsEnabled(!editingCustomPermissionsEnabled)}
                                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                                          editingCustomPermissionsEnabled ? "bg-[#10B981]" : "bg-slate-800"
                                        }`}
                                      >
                                        <span className={`w-4 h-4 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                                          editingCustomPermissionsEnabled ? "translate-x-4.5" : "translate-x-0.5"
                                        }`} />
                                      </button>
                                    </div>

                                    {editingCustomPermissionsEnabled && (
                                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl text-left">
                                        <div className="flex items-center justify-between border-b border-slate-850 pb-3 gap-4 flex-wrap">
                                          <div className="flex items-center gap-4 flex-wrap w-full justify-between">
                                            <h4 className="text-xs font-black text-slate-200 flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                                              <span>{language === "bn" ? "অ্যাকাউন্ট কাস্টম পারমিশন" : "Account Custom Permissions"}</span>
                                            </h4>

                                            {/* Category Tab Buttons */}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              {[
                                                { id: "All", label: language === "bn" ? "সমস্ত" : "All", tooltip: language === "bn" ? "সব পারমিশন" : "All Permissions" },
                                                { id: "Ad", label: language === "bn" ? "Add" : "Add", tooltip: language === "bn" ? "অ্যাড করা" : "Add/Create Permissions" },
                                                { id: "V", label: language === "bn" ? "View" : "View", tooltip: language === "bn" ? "ভিউ করা" : "View Permissions" },
                                                { id: "D", label: language === "bn" ? "Delete" : "Delete", tooltip: language === "bn" ? "ডিলিট করা" : "Delete Permissions" },
                                                { id: "Ed", label: language === "bn" ? "Edit" : "Edit", tooltip: language === "bn" ? "এডিট করা" : "Edit Permissions" },
                                              ].map((btn) => {
                                                const isActive = editingUserSubTab === btn.id;
                                                return (
                                                  <button
                                                    key={btn.id}
                                                    type="button"
                                                    onClick={() => {
                                                      setEditingUserSubTab(btn.id as any);
                                                    }}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border transition-all duration-300 cursor-pointer ${
                                                      isActive
                                                        ? "bg-[#10B981]/10 border-[#10B981] text-[#10B981] shadow-sm shadow-[#10B981]/10"
                                                        : "bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900 hover:border-slate-700"
                                                    }`}
                                                    title={btn.tooltip}
                                                  >
                                                    {btn.label}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>

                                        {(() => {
                                          const keysToRender: { key: string; label: string }[] = [];
                                          
                                          if (editingUserSubTab === "All") {
                                            const allKeys = [
                                              ...PERMISSION_GROUPS.Ad,
                                              ...PERMISSION_GROUPS.V,
                                              ...PERMISSION_GROUPS.D,
                                              ...PERMISSION_GROUPS.Ed
                                            ];
                                            const seen = new Set<string>();
                                            for (const item of allKeys) {
                                              if (!seen.has(item.key)) {
                                                seen.add(item.key);
                                                keysToRender.push({
                                                  key: item.key,
                                                  label: language === "bn" ? item.label.bn : item.label.en
                                                });
                                              }
                                            }
                                          } else {
                                            const groupKeys = PERMISSION_GROUPS[editingUserSubTab as "Ad" | "V" | "D" | "Ed"] || [];
                                            for (const item of groupKeys) {
                                              keysToRender.push({
                                                key: item.key,
                                                label: language === "bn" ? item.label.bn : item.label.en
                                              });
                                            }
                                          }

                                          const handleToggleAll = (enabled: boolean) => {
                                            const allKeys = [
                                              ...PERMISSION_GROUPS.Ad,
                                              ...PERMISSION_GROUPS.V,
                                              ...PERMISSION_GROUPS.D,
                                              ...PERMISSION_GROUPS.Ed
                                            ];
                                            const updated = { ...editingCustomPermissions };
                                            for (const item of allKeys) {
                                              updated[item.key] = enabled;
                                            }
                                            setEditingCustomPermissions(updated);
                                          };

                                          const half = Math.ceil(keysToRender.length / 2);
                                          const leftColumn = keysToRender.slice(0, half);
                                          const rightColumn = keysToRender.slice(half);

                                          return (
                                            <div className="space-y-4">
                                              {editingUserSubTab === "All" && (
                                                <div className="flex flex-wrap items-center gap-3 bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl mb-2">
                                                  <span className="text-[10px] font-black text-slate-350 uppercase tracking-wider font-mono">
                                                    {language === "bn" ? "গ্লোবাল নিয়ন্ত্রণ:" : "Global Controls:"}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleToggleAll(true)}
                                                    className="px-2.5 py-1 rounded bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/20 text-[9px] font-bold uppercase transition-all cursor-pointer"
                                                  >
                                                    {language === "bn" ? "সমস্ত সক্রিয় করুন" : "Activate All"}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleToggleAll(false)}
                                                    className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase transition-all cursor-pointer"
                                                  >
                                                    {language === "bn" ? "সমস্ত নিষ্ক্রিয় করুন" : "Deactivate All"}
                                                  </button>
                                                </div>
                                              )}

                                              <div className="flex flex-col md:flex-row md:items-stretch gap-y-4 md:gap-x-8 min-h-[180px]">
                                                <div className="flex-1 space-y-3">
                                                  {leftColumn.map(({ key, label }) => {
                                                    const value = !!editingCustomPermissions[key];
                                                    const isKeyInSelectedGroup = editingUserSubTab === "All" || (
                                                      PERMISSION_GROUPS[editingUserSubTab as "Ad" | "V" | "D" | "Ed"]?.some(item => item.key === key)
                                                    );
                                                    return (
                                                      <label key={key} className="flex items-center justify-between group cursor-pointer py-0.5 select-none transition-all duration-300 opacity-100">
                                                        <span className={`text-[11px] font-semibold transition-colors ${
                                                          editingUserSubTab !== "All" && isKeyInSelectedGroup
                                                            ? "text-[#10B981] font-extrabold"
                                                            : "text-slate-300 group-hover:text-white"
                                                        }`}>
                                                          {label}
                                                        </span>
                                                        <div className="relative inline-block w-8 h-4 shrink-0">
                                                          <input 
                                                            type="checkbox"
                                                            className="peer sr-only"
                                                            checked={value}
                                                            onChange={(e) => {
                                                              setEditingCustomPermissions({
                                                                ...editingCustomPermissions,
                                                                [key]: e.target.checked
                                                              });
                                                            }}
                                                          />
                                                          <div className="block bg-slate-950 border border-slate-850 w-full h-full rounded-full peer-checked:bg-[#10B981] peer-checked:border-[#10B981] transition-all"></div>
                                                          <div className="absolute left-[2px] top-[2px] bg-slate-500 w-3 h-3 rounded-full transition-all peer-checked:translate-x-full peer-checked:bg-white"></div>
                                                        </div>
                                                      </label>
                                                    );
                                                  })}
                                                </div>

                                                {/* Elegant Vertical Divider Line */}
                                                <div className="hidden md:block w-[1px] bg-slate-800/80 self-stretch" />

                                                <div className="flex-1 space-y-3">
                                                  {rightColumn.map(({ key, label }) => {
                                                    const value = !!editingCustomPermissions[key];
                                                    const isKeyInSelectedGroup = editingUserSubTab === "All" || (
                                                      PERMISSION_GROUPS[editingUserSubTab as "Ad" | "V" | "D" | "Ed"]?.some(item => item.key === key)
                                                    );
                                                    return (
                                                      <label key={key} className="flex items-center justify-between group cursor-pointer py-0.5 select-none transition-all duration-300 opacity-100">
                                                        <span className={`text-[11px] font-semibold transition-colors ${
                                                          editingUserSubTab !== "All" && isKeyInSelectedGroup
                                                            ? "text-[#10B981] font-extrabold"
                                                            : "text-slate-300 group-hover:text-white"
                                                        }`}>
                                                          {label}
                                                        </span>
                                                        <div className="relative inline-block w-8 h-4 shrink-0">
                                                          <input 
                                                            type="checkbox"
                                                            className="peer sr-only"
                                                            checked={value}
                                                            onChange={(e) => {
                                                              setEditingCustomPermissions({
                                                                ...editingCustomPermissions,
                                                                [key]: e.target.checked
                                                              });
                                                            }}
                                                          />
                                                          <div className="block bg-slate-950 border border-slate-850 w-full h-full rounded-full peer-checked:bg-[#10B981] peer-checked:border-[#10B981] transition-all"></div>
                                                          <div className="absolute left-[2px] top-[2px] bg-slate-500 w-3 h-3 rounded-full transition-all peer-checked:translate-x-full peer-checked:bg-white"></div>
                                                        </div>
                                                      </label>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}

                                    {/* Allowed Emirates Multi-select Selector */}
                                    <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
                                      <span className="block text-[10px] font-bold text-slate-350 uppercase tracking-wider">
                                        🌍 {language === "bn" ? "অনুমোদিত আমিরাত সমূহ (এলাকা ফিল্টার)" : "Allowed Emirates (Regional Access Control)"}
                                      </span>
                                      <div className="flex flex-wrap gap-2">
                                        {[
                                          { id: "Ajman", label: language === "bn" ? "আজমান" : "Ajman" },
                                          { id: "Dubai", label: language === "bn" ? "দুবাই" : "Dubai" },
                                          { id: "Sharjah", label: language === "bn" ? "শারজাহ" : "Sharjah" },
                                          { id: "Umm Al Quwain", label: language === "bn" ? "উম্ম আল কুয়াইন" : "Umm Al Quwain" },
                                          { id: "Ras Al Khaimah", label: language === "bn" ? "রাস আল খাইমাহ" : "Ras Al Khaimah" },
                                          { id: "Fujairah", label: language === "bn" ? "ফুজিরাহ" : "Fujairah" },
                                          { id: "Al Dhaid", label: language === "bn" ? "আল ধাইদ" : "Al Dhaid" },
                                        ].map((em) => {
                                          const isSelected = editingAllowedEmirates.includes(em.id);
                                          return (
                                            <button
                                              key={em.id}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  setEditingAllowedEmirates(editingAllowedEmirates.filter(x => x !== em.id));
                                                } else {
                                                  setEditingAllowedEmirates([...editingAllowedEmirates, em.id]);
                                                }
                                              }}
                                              className={`px-3 py-1.5 rounded-xl border text-[10.5px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                isSelected
                                                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                              }`}
                                            >
                                              <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-emerald-400" : "bg-slate-600"}`} />
                                              <span>{em.label}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div> {/* End Security Tab */}

      {/* ===================== TAB: PASSWORD & SECURITY ===================== */}
      <div className={activeTab === "password_security" ? "space-y-6 block animate-fade-in" : "hidden"}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
          
          {/* LEFT BENTO CELL: Password Change Box (Size 7 span) */}
          <div className="lg:col-span-7 bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-6 shadow-xl space-y-5">
            <div className="space-y-1.5 border-b border-slate-800 pb-4">
              <span className="text-[9.5px] font-black uppercase tracking-widest text-[#10B981] font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                🔒 credentials authority
              </span>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2 mt-1">
                <Lock className="w-5 h-5 text-[#10B981]" />
                <span>{language === "bn" ? "অ্যাকাউন্ট পাসওয়ার্ড পরিবর্তন করুন" : "Change Account Credentials"}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === "bn" 
                  ? "আপনার ব্রাউজারে বা সিস্টেমে লগইন করা অ্যাকাউন্টের নিরাপত্তা পাসওয়ার্ড এখান থেকে পরিবর্তন করুন।" 
                  : "Rotate and update security keys for active user profiles securely stored in local and state cache."}
              </p>
            </div>

            {psSuccess && (
              <div className="p-3 bg-emerald-950/20 border border-[#10B981]/25 text-[#10B981] font-bold rounded-2xl flex items-center gap-2 text-[11px] animate-pulse">
                <Check className="w-4 h-4 shrink-0" />
                <span>{psSuccess}</span>
              </div>
            )}

            {psError && (
              <div className="p-3 bg-red-950/20 border border-red-500/25 text-red-400 font-bold rounded-2xl flex items-center gap-2 text-[11px]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{psError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSecuritySubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-350 block">
                  👤 {language === "bn" ? "যার পাসওয়ার্ড পরিবর্তন করবেন" : "Target Account Operator"}
                </label>
                <select
                  value={psSelectedUser}
                  onChange={(e) => setPsSelectedUser(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-750 focus:border-[#10B981] rounded-xl py-2.5 px-3 text-xs outline-none cursor-pointer transition-colors"
                >
                  <option value="self">
                    {language === "bn" ? `নিজের অ্যাকাউন্ট (${loggedInUser?.username || "সুপার এডমিন"})` : `My Active Account (${loggedInUser?.username || "Superintendent"})`}
                  </option>
                  {loggedInUser?.role === "Admin" && usersList.map(u => {
                    if (loggedInUser.id === u.id) return null;
                    return (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.role})
                      </option>
                    )
                  })}
                </select>
                {loggedInUser?.role !== "Admin" && (
                  <p className="text-[9.5px] text-slate-500 italic">
                    {language === "bn" ? "*মডারেটর বা ভিজিটররা অন্য অ্যাকাউন্ট এডিট করতে পারবে না।" : "*Policy enforces that only administrative operators can modify other system keys."}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4 pt-1">
                {/* Current Key Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-350 block">
                    🔑 {language === "bn" ? "বর্তমান অ্যাক্টিভ পাসওয়ার্ড" : "Enter Current Key"}
                  </label>
                  <div className="relative">
                    <input
                      type={psShowCurrent ? "text" : "password"}
                      value={psCurrentPassword}
                      onChange={(e) => setPsCurrentPassword(e.target.value)}
                      placeholder={language === "bn" ? "ভেরিফিকেশনের জন্য বর্তমান কি লিখুন" : "Current authentication secret..."}
                      className="w-full bg-slate-950 text-slate-100 border border-slate-750 focus:border-[#10B981] rounded-xl py-2.5 pl-3 pr-10 text-xs outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setPsShowCurrent(!psShowCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {psShowCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Key Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-350 block">
                    🆕 {language === "bn" ? "নতুন সিকিউর পাসওয়ার্ড" : "Enter New Security Key"}
                  </label>
                  <div className="relative">
                    <input
                      type={psShowNew ? "text" : "password"}
                      value={psNewPassword}
                      onChange={(e) => setPsNewPassword(e.target.value)}
                      placeholder={language === "bn" ? "নতুন পাসওয়ার্ডটি লিখুন" : "Minimum 6 digits/characters..."}
                      className="w-full bg-slate-950 text-slate-100 border border-slate-750 focus:border-[#10B981] rounded-xl py-2.5 pl-3 pr-10 text-xs outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setPsShowNew(!psShowNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {psShowNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {psNewPassword && (
                    <div className="space-y-1 pt-1.5 text-left">
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-slate-500">{language === "bn" ? "পাসওয়ার্ডের ক্ষমতা স্তরের মান:" : "Strength rating:"}</span>
                        <span className="font-extrabold" style={{ color: getPasswordStrength(psNewPassword).color === "bg-red-500" ? "#EF4444" : getPasswordStrength(psNewPassword).color === "bg-amber-500" ? "#FBBF24" : "#10B981" }}>
                          {language === "bn" ? getPasswordStrength(psNewPassword).labelBn : getPasswordStrength(psNewPassword).label}
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 border border-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${getPasswordStrength(psNewPassword).color} ${getPasswordStrength(psNewPassword).width}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Key Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-350 block">
                    🔄 {language === "bn" ? "নতুন পাসওয়ার্ড নিশ্চিত করুন" : "Confirm New Security Key"}
                  </label>
                  <div className="relative">
                    <input
                      type={psShowConfirm ? "text" : "password"}
                      value={psConfirmPassword}
                      onChange={(e) => setPsConfirmPassword(e.target.value)}
                      placeholder={language === "bn" ? "আবার লিখে মিল করুন" : "Re-type new security key..."}
                      className="w-full bg-slate-950 text-slate-100 border border-slate-750 focus:border-[#10B981] rounded-xl py-2.5 pl-3 pr-10 text-xs outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setPsShowConfirm(!psShowConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {psShowConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 py-3 rounded-xl font-black text-xs transition-all active:scale-[0.99] flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 border-0"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{language === "bn" ? "পাসওয়ার্ড ও প্রিভিলেজ কিয়ান পরিবর্তন করুন" : "Commit Security Password Change"}</span>
                </button>
              </div>
              
            </form>
          </div>

          {/* RIGHT BENTO CELL: Trusted Phone Link & Recovery Number (Size 5 span) */}
          <div className="lg:col-span-5 bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="space-y-1 border-b border-slate-800 pb-3">
              <span className="text-[9.5px] font-black uppercase tracking-widest text-[#10B981] font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                📱 recovery verification
              </span>
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2 mt-1">
                <Smartphone className="w-5 h-5 text-[#10B981]" />
                <span>{language === "bn" ? "মোবাইল নাম্বার লিংক (অ্যাড)" : "Link Account Recover Number"}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === "bn"
                  ? "পাসওয়ার্ড ভুলে গেলে মোবাইল নাম্বার ব্যবহার করে ওটিপি (OTP) দ্বারা অ্যাকাউন্ট উদ্ধারের ব্যবস্থা।"
                  : "Establish a certified mobile recovery number to regain access via verified OTP streams."}
              </p>
            </div>

            {/* Display Active Linked Phone If Verified */}
            {isPhoneVerified && phoneNumber ? (
              <div className="bg-emerald-950/20 border border-emerald-500/25 p-4 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#10B981] text-slate-950 p-1.5 rounded-lg text-xs leading-none font-black animate-pulse">✓</span>
                    <div className="text-left font-sans">
                      <span className="block text-[9.5px] font-bold text-[#10B981] uppercase font-mono tracking-wider">Trusted Link Status: Active</span>
                      <span className="block text-sm font-black text-slate-100 font-mono">{phoneNumber}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-[#10B981] px-2 py-0.5 rounded-full font-mono font-bold">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[10px] text-slate-350 leading-normal">
                  {language === "bn" 
                    ? "এই নাম্বারটি আপনার অপারেটর সিস্টেমে অ্যাডমিনের সাথে সফলভাবে লিংক করা হয়েছে। গুরুত্বপূর্ণ অ্যালার্টগুলো এই নাম্বারে যাবে।"
                    : "This number is officially associated with this superintendent identity. Operational and credentials alarms will be routed here."}
                </p>
                <button
                  type="button"
                  onClick={handleRemovePhone}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-2 rounded-xl text-[10.5px] font-black transition-all cursor-pointer"
                >
                  ✕ {language === "bn" ? "লিংক করা নাম্বারটি রিমুভ করুন" : "Unlink Recovery Number"}
                </button>
              </div>
            ) : (
              // Add Phone Flow
              <div className="space-y-3.5">
                {phoneSuccess && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/25 text-[#10B981] font-bold rounded-xl text-[10px] leading-relaxed text-left">
                    {phoneSuccess}
                  </div>
                )}
                {phoneError && (
                  <div className="p-3 bg-red-950/20 border border-red-500/25 text-red-400 font-bold rounded-xl text-[10px] leading-relaxed text-left">
                    {phoneError}
                  </div>
                )}

                {!isVerifyingPhone ? (
                  // Initial Number Entry
                  <form onSubmit={handleSendOTP} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        {language === "bn" ? "নতুন মোবাইল নাম্বার প্রবেশ করান" : "Recovery Mobile Number (w/ Country Prefix)"}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-black text-xs select-none">
                          +880 / +971
                        </span>
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="01712345678 / 501234567"
                          className="w-full bg-slate-950 text-slate-100 border border-slate-755 focus:border-[#10B981] rounded-xl py-2.5 pl-24 pr-3 text-xs outline-none font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-100 py-2.5 rounded-xl text-[11px] font-black tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>{language === "bn" ? "ওটিপি (OTP) ও ভেরিফিকেশন কোড পাঠান" : "Verify & Send Authenticated OTP"}</span>
                    </button>
                  </form>
                ) : (
                  // OTP entry form
                  <form onSubmit={handleVerifyOTP} className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800 animate-fadeIn">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-emerald-400 block">
                          🔑 {language === "bn" ? "ফোনে পাঠানো কোডটি দিন" : "Enter Verification OTP"}
                        </label>
                        <span className="text-[9px] text-[#10B981] font-bold font-mono py-0.5 px-2 bg-emerald-500/10 rounded-full animate-bounce">
                          OTP Sent
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={userOTPInput}
                        onChange={(e) => setUserOTPInput(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full bg-slate-950 text-slate-100 border border-emerald-500/30 text-center text-lg font-black tracking-[0.4em] rounded-xl py-2.5 outline-none font-mono focus:border-[#10B981]"
                      />
                    </div>
                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsVerifyingPhone(false);
                          setPhoneSuccess("");
                          setPhoneError("");
                        }}
                        className="flex-1 bg-slate-850 hover:bg-slate-800 border border-slate-755 text-slate-400 py-2 rounded-xl text-[10.5px] font-bold cursor-pointer"
                      >
                        {language === "bn" ? "বাতিল" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-[#10B981] hover:bg-emerald-400 text-slate-950 py-2 rounded-xl text-[10.5px] font-black cursor-pointer"
                      >
                        {language === "bn" ? "কোড নিশ্চিত করুন" : "Certify OTP"}
                      </button>
                    </div>
                  </form>
                )}
                
                <p className="text-[9.5px] text-slate-500 leading-normal bg-slate-950/20 p-2.5 rounded-xl border border-slate-850/30 text-left">
                  📱 <strong>{language === "bn" ? "সিকিউরিটি নির্দেশিকা:" : "Verification Sandbox Info:"}</strong> {language === "bn" ? "যেহেতু এটি একটি ডেমো প্রজেক্ট, সিস্টেমটি রিয়েল SMS-এর পরিবর্তে স্ক্রিনে একটি ডেমো ওটিপি দেখাবে। আসল প্রোডাকশনে এটি সরাসরি ইউজারদের হ্যান্ডসেটে পাঠানো হয়।" : "This setup processes via a secure local proxy sandbox. The generated OTP code will play inline for quick verification preview."}
                </p>
              </div>
            )}
          </div>

          {/* LOWER BENTO CELL 1: Two Factor Authenticator Integration (Size 12 span) */}
          <div className="lg:col-span-12 bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full text-[9px] text-cyan-400 font-extrabold font-mono uppercase tracking-widest">
                  🛡️ premium mfa protection
                </div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2 mt-1">
                  <Key className="w-5 h-5 text-cyan-400" />
                  <span>{language === "bn" ? "২-ফ্যাক্টর অথেনটিকেশন নিরাপত্তা (Two-Factor 2FA Shield)" : "Two-Factor Authentication (2FA Shield)"}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {language === "bn"
                    ? "গুগল বা মাইক্রোসফ্ট অথেনটিকেটর অ্যাপ ব্যবহার করে আপনার কোম্পানির অ্যাডমিন অ্যাকাউন্টের জন্য অতিরিক্ত স্তরের সুরক্ষা ব্যবস্থা সক্রিয় করুন।"
                    : "Establish multi-factor cryptographic security layers linked with Google Authenticator or secondary auth keys."}
                </p>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-3 self-start md:self-center">
                <span className={`text-xs font-black uppercase font-mono ${is2FAEnabled ? "text-cyan-400" : "text-slate-500"}`}>
                  {is2FAEnabled ? (language === "bn" ? "সক্রিয় আছে (MFA Active)" : "MFA Protected") : (language === "bn" ? "নিষ্ক্রিয় (MFA Disabled)" : "Inactive")}
                </span>
                
                {is2FAEnabled ? (
                  <button
                    onClick={handleDisable2FA}
                    className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-white border border-cyan-500/30 px-4 py-2 rounded-xl text-[10px] font-black tracking-wide transition cursor-pointer"
                  >
                    DISABLE 2FA SHIELD
                  </button>
                ) : (
                  <button
                    onClick={() => setShow2FAVisualizer(!show2FAVisualizer)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black tracking-wide transition-all cursor-pointer shadow-lg shadow-cyan-500/10"
                  >
                    ENABLE 2FA PROTECT
                  </button>
                )}
              </div>
            </div>

            {/* 2FA Notifications */}
            {twoFAAlert && (
              <div className={`p-4 rounded-2xl text-[11px] leading-relaxed text-left animate-fadeIn font-extrabold ${
                twoFAAlert.startsWith("SUCCESS_")
                  ? "bg-emerald-950/20 border border-[#10B981]/25 text-[#10B981]"
                  : twoFAAlert.startsWith("ERROR_")
                    ? "bg-red-950/20 border border-red-500/25 text-red-400"
                    : "bg-slate-900 border border-slate-800 text-slate-350"
              }`}>
                {twoFAAlert.replace(/^(SUCCESS_|ERROR_|INFO_)/, "")}
              </div>
            )}

            {/* 2FA Activation Setup View */}
            {show2FAVisualizer && !is2FAEnabled && (
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center animate-fadeIn text-left">
                
                {/* Simulated Google Authenticator QR visual */}
                <div className="md:col-span-4 flex flex-col items-center justify-center space-y-2.5 bg-slate-900 p-4 border border-slate-800 rounded-xl">
                  <div className="w-32 h-32 bg-white rounded-lg p-2.5 flex items-center justify-center shadow-lg relative overflow-hidden">
                    {/* Retro Simulated matrix layout (representing real QR code) */}
                    <div className="w-full h-full bg-slate-900 flex flex-col justify-between p-1.5 gap-1.5 opacity-85">
                      <div className="flex justify-between h-1/4">
                        <span className="w-1/3 bg-white h-full border border-slate-950" />
                        <span className="w-1/3 h-full border border-white" />
                        <span className="w-1/3 bg-white h-full border border-slate-950" />
                      </div>
                      <div className="flex justify-between h-1/3 gap-1">
                        <span className="w-1/4 h-full bg-white" />
                        <span className="flex-1 h-full bg-white border border-slate-950" />
                        <span className="w-1/5 h-full bg-white" />
                      </div>
                      <div className="flex justify-between h-1/4">
                        <span className="w-1/3 bg-white h-full border border-slate-950" />
                        <span className="w-1/3 h-full bg-white" />
                        <span className="w-1/3 bg-white h-full border border-slate-950" />
                      </div>
                    </div>
                    {/* Lock Icon in center of mock QR */}
                    <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                      🔒
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest font-black uppercase text-center mt-1">
                    Google / Microsoft Auth
                  </span>
                </div>

                {/* Instructions and Input Key */}
                <div className="md:col-span-8 space-y-4">
                  <div className="space-y-1.5 leading-relaxed text-slate-350">
                    <p className="font-extrabold text-[#10B981] text-[11px] uppercase tracking-wider font-mono">
                      MFA Setup Wizard:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>{language === "bn" ? "আপনার মোবাইলে Google Authenticator অ্যাপটি ওপেন করুন।" : "Open your preferred Authenticator app on your handset."}</li>
                      <li>{language === "bn" ? "অথবা নিচের সিক্রেট কী কোডটি কপি করে টাইপ করুন:" : "Scan the simulated QR code to pair seamlessly, or insert secret key manually:"}</li>
                    </ol>
                    <div className="flex items-center gap-1.5 pt-1">
                      <code className="bg-[#0B0F19] text-cyan-400 px-3 py-1.5 rounded border border-slate-800 text-xs font-mono font-black select-all tracking-wider">
                        {twoFactorSecret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(twoFactorSecret);
                          alert(language === "bn" ? "অথেনটিকেশন কী কপি করা হয়েছে!" : "MFA secret copied successfully!");
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1.5 rounded text-[10px] font-bold cursor-pointer"
                      >
                        COPY Key
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleVerifyAndEnable2FA} className="space-y-2 max-w-sm pt-1">
                    <label className="text-[10.5px] font-bold text-slate-300 block">
                      🛡️ {language === "bn" ? "অথেনটিকেটর থেকে প্রাপ্ত কোডটি টাইপ করুন" : "Confirm verification code (Enter '123456')"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={twoFactorInput}
                        onChange={(e) => setTwoFactorInput(e.target.value.replace(/[^0-9]/g, ""))}
                        className="flex-1 bg-slate-950 text-slate-100 border border-slate-755 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest focus:border-cyan-400 outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-colors"
                      >
                        ACTIVATE
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500">
                      * {language === "bn" ? "টেস্ট বা ডেমো ভেরিফিকেশন করার জন্য '123456' টাইপ করে অ্যাক্টিভেট ক্লিক করুন।" : "To simulate successful configuration, provide 6 digits e.g. '123456' and apply."}
                    </p>
                  </form>
                </div>

              </div>
            )}

            {/* Simulated protection details if active */}
            {is2FAEnabled && (
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-left space-y-2 animate-fadeIn">
                <span className="block text-[11px] font-black text-emerald-400 uppercase tracking-widest font-mono">
                  🚨 SYSTEM SECURITY SHIELD PROTOCOL: ENGAGED
                </span>
                <p className="text-xs text-slate-350 leading-relaxed">
                  {language === "bn" 
                    ? "সুপার এডমিন প্যানেল এবং সমস্ত বিলিং সেটিংস মডিউল সফলভাবে ২-ফ্যাক্টর অথেনটিকেশন (2FA) প্রোটেক্টেড। যেকোনো গুরুত্বপূর্ণ ডাটা মুছে ফেলা বা ফ্যাক্টরি রিসেটের ক্ষেত্রে এই সুরক্ষা স্তরটি অতিরিক্ত মোবাইল কনফার্মেশন প্রম্পট রিসিভ করবে।"
                    : "Your system privilege gates are running under multi-layered MFA protection. Actions like full-database wipes, critical invoice deletes, and superintendent profile modifications will query physical 2FA security validation keys."}
                </p>
              </div>
            )}
          </div>
          {/* LOWER BENTO CELL 2: Active Session Footprints & Device Auditing (Size 12 span) */}
          <div className="lg:col-span-12 bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="space-y-1 border-b border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[9.5px] font-black uppercase tracking-widest text-[#10B981] font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  🌐 live audit logs
                </span>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2 mt-1">
                  <Sliders className="w-5 h-5 text-[#10B981]" />
                  <span>{language === "bn" ? "সক্রিয় লগইন সেশন অডিট ও ডিভাইস লক" : "Authorized Active Sessions Auditor"}</span>
                </h3>
              </div>
              
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setSessions(sessions.filter(s => s.active));
                    setSessionSuccess(language === "bn" ? "অন্যান্য ডিভাইসগুলো থেকে সেশনটি সফলভাবে অবসান করা হয়েছে।" : "All secondary footprints were successfully purged!");
                    setTimeout(() => setSessionSuccess(""), 4000);
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3.5 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer"
                >
                  REVOKE ALL COMPANIONS
                </button>
              )}
            </div>

            {sessionSuccess && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/25 text-[#10B981] font-bold rounded-xl text-[10.5px] text-left animate-fadeIn">
                ✓ {sessionSuccess}
              </div>
            )}

            <div className="overflow-x-auto">
              <div className="min-w-[600px] divide-y divide-slate-805">
                {sessions.map((ses) => (
                  <div key={ses.id} className="py-3 flex justify-between items-center hover:bg-slate-900/10 rounded-xl px-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-slate-400">
                        {ses.active ? "💻" : "📱"}
                      </div>
                      <div className="text-left leading-tight">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-black text-slate-100">{ses.device}</span>
                          {ses.active && (
                            <span className="text-[8px] bg-[#10B981]/10 text-emerald-400 border border-emerald-500/20 font-black px-1.5 py-0.5 rounded leading-none">
                              THIS DEVICE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-450 mt-1 font-mono">
                          IP: {ses.ip} • Locations: <span className="text-slate-350">{ses.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10.5px] font-bold font-mono text-slate-450">
                        {ses.date}
                      </span>
                      {!ses.active && (
                        <button
                          type="button"
                          onClick={() => handleTerminateSession(ses.id)}
                          className="text-[9.5px] font-black bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-red-500/15 cursor-pointer transition-colors"
                          title="Purge session authority"
                        >
                          REVOKE
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div> {/* End Password Security Tab */}

      {/* ===================== TAB: ROLE PERMISSIONS ===================== */}
      <div className={activeTab === "role_permissions" ? "space-y-6 block animate-fade-in" : "hidden"}>
        <div className="bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#10B981]" />
              <span>{language === "bn" ? "রোল পারমিশন সেটিং" : "Role Permissions Settings"}</span>
            </h3>
          </div>

          {/* Beautiful 1, 2, 3 Role Selection Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-800/60 pb-5">
            {[
              { id: "Acting Leader", num: "1", labelBn: "অ্যাক্টিং লিডার", labelEn: "Acting Leader", descBn: "পারমিশন সেট করুন", descEn: "Set Permissions" },
              { id: "Moderator", num: "2", labelBn: "মডারেটর", labelEn: "Moderator", descBn: "পারমিশন সেট করুন", descEn: "Set Permissions" },
              { id: "Visitor", num: "3", labelBn: "ভিজিটর", labelEn: "Visitor", descBn: "পারমিশন সেট করুন", descEn: "Set Permissions" },
            ].map((roleOpt) => {
              const isSelected = selectedRoleToManage === roleOpt.id;
              return (
                <button
                  key={roleOpt.id}
                  type="button"
                  onClick={() => setSelectedRoleToManage(roleOpt.id as any)}
                  className={`p-4 rounded-2xl border transition-all duration-300 text-left flex items-start gap-3.5 select-none relative cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/25"
                      : "border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  {/* Number Badge */}
                  <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border transition-colors ${
                    isSelected
                      ? "bg-emerald-500 border-emerald-400 text-slate-950"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}>
                    {roleOpt.num}
                  </div>
                  
                  <div className="space-y-0.5 leading-normal">
                    <p className={`font-black text-[11px] uppercase tracking-wider font-mono ${
                      isSelected ? "text-emerald-400" : "text-slate-200"
                    }`}>
                      {language === "bn" ? roleOpt.labelBn : roleOpt.labelEn}
                    </p>
                    <p className="text-[10px] text-slate-450 font-semibold font-sans">
                      {language === "bn" ? roleOpt.descBn : roleOpt.descEn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Single permissions editor panel below the tabs */}
          <div className="w-full">
            <div className="bg-slate-900 border border-slate-750 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-4 flex-wrap">
                <div className="flex items-center gap-4 flex-wrap">
                  <h4 className="text-sm font-black text-slate-200 flex items-center gap-2 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {selectedRoleToManage === "Acting Leader"
                        ? (language === "bn" ? "অ্যাক্টিং লিডার পারমিশন" : "Acting Leader Permissions")
                        : selectedRoleToManage === "Moderator"
                          ? (language === "bn" ? "মডারেটর পারমিশন" : "Moderator Permissions")
                          : (language === "bn" ? "ভিজিটর পারমিশন" : "Visitor Permissions")
                      }
                    </span>
                  </h4>

                  {/* Beautiful Separate Framed Tab Buttons Next to Title (instead of right-side circles) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: "All", label: language === "bn" ? "সমস্ত" : "All", tooltip: language === "bn" ? "সব পারমিশন" : "All Permissions" },
                      { id: "Ad", label: language === "bn" ? "Add" : "Add", tooltip: language === "bn" ? "অ্যাড করা" : "Add/Create Permissions" },
                      { id: "V", label: language === "bn" ? "View" : "View", tooltip: language === "bn" ? "ভিউ করা" : "View Permissions" },
                      { id: "D", label: language === "bn" ? "Delete" : "Delete", tooltip: language === "bn" ? "ডিলিট করা" : "Delete Permissions" },
                      { id: "Ed", label: language === "bn" ? "Edit" : "Edit", tooltip: language === "bn" ? "এডিট করা" : "Edit Permissions" },
                    ].map((btn) => {
                      const isActive = modSubTab === btn.id;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => {
                            setModSubTab(btn.id as any);
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black tracking-wide border transition-all duration-300 cursor-pointer ${
                            isActive
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm shadow-emerald-500/10"
                              : "bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-650"
                          }`}
                          title={btn.tooltip}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {(() => {
                const currentSubTab = modSubTab;
                const targetRole = selectedRoleToManage;
                
                const keysToRender: { key: string; label: string }[] = [];
                
                if (currentSubTab === "All") {
                  const allKeys = [
                    ...PERMISSION_GROUPS.Ad,
                    ...PERMISSION_GROUPS.V,
                    ...PERMISSION_GROUPS.D,
                    ...PERMISSION_GROUPS.Ed
                  ];
                  const seen = new Set<string>();
                  for (const item of allKeys) {
                    if (!seen.has(item.key)) {
                      seen.add(item.key);
                      keysToRender.push({
                        key: item.key,
                        label: language === "bn" ? item.label.bn : item.label.en
                      });
                    }
                  }
                } else {
                  const groupKeys = PERMISSION_GROUPS[currentSubTab as "Ad" | "V" | "D" | "Ed"] || [];
                  for (const item of groupKeys) {
                    keysToRender.push({
                      key: item.key,
                      label: language === "bn" ? item.label.bn : item.label.en
                    });
                  }
                }
                
                const handleToggleAll = (enabled: boolean) => {
                  if (setRolePermissions && rolePermissions) {
                    const allKeys = [
                      ...PERMISSION_GROUPS.Ad,
                      ...PERMISSION_GROUPS.V,
                      ...PERMISSION_GROUPS.D,
                      ...PERMISSION_GROUPS.Ed
                    ];
                    const updatedRole = { ...(rolePermissions[targetRole] || DEFAULT_ROLE_PERMISSIONS[targetRole] || {}) };
                    for (const item of allKeys) {
                      updatedRole[item.key] = enabled;
                    }
                    const updated = {
                      ...rolePermissions,
                      [targetRole]: updatedRole
                    };
                    setRolePermissions(updated);
                    saveStoreValue("rolePermissions", updated);
                  }
                };

                const half = Math.ceil(keysToRender.length / 2);
                const leftColumn = keysToRender.slice(0, half);
                const rightColumn = keysToRender.slice(half);
                
                return (
                  <div className="space-y-4">
                    {currentSubTab === "All" && (
                      <div className="flex flex-wrap items-center gap-3 bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl mb-2">
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider font-mono">
                          {language === "bn" ? "গ্লোবাল নিয়ন্ত্রণ:" : "Global Controls:"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleAll(true)}
                          className="px-3 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase transition-all cursor-pointer"
                        >
                          {language === "bn" ? "সমস্ত সক্রিয় করুন" : "Activate All"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAll(false)}
                          className="px-3 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase transition-all cursor-pointer"
                        >
                          {language === "bn" ? "সমস্ত নিষ্ক্রিয় করুন" : "Deactivate All"}
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-stretch gap-y-4 md:gap-x-12 min-h-[220px]">
                      <div className="flex-1 space-y-3.5">
                        {leftColumn.map(({ key, label }) => {
                          const value = rolePermissions ? (rolePermissions[targetRole]?.[key] ?? DEFAULT_ROLE_PERMISSIONS[targetRole]?.[key] ?? false) : false;
                          const isKeyInSelectedGroup = currentSubTab === "All" || (
                            PERMISSION_GROUPS[currentSubTab as "Ad" | "V" | "D" | "Ed"]?.some(item => item.key === key)
                          );
                          return (
                            <label key={key} className="flex items-center justify-between group cursor-pointer py-0.5 select-none transition-all duration-300 opacity-100">
                              <span className={`text-xs font-semibold transition-colors ${
                                currentSubTab !== "All" && isKeyInSelectedGroup
                                  ? "text-emerald-400 font-extrabold"
                                  : "text-slate-200 group-hover:text-white"
                              }`}>
                                {label}
                              </span>
                              <div className="relative inline-block w-10 h-5 shrink-0">
                                <input 
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={value as boolean}
                                  onChange={(e) => {
                                    if (setRolePermissions && rolePermissions) {
                                      const updated = {
                                        ...rolePermissions,
                                        [targetRole]: {
                                          ...(DEFAULT_ROLE_PERMISSIONS[targetRole] || {}),
                                          ...(rolePermissions[targetRole] || {}),
                                          [key]: e.target.checked
                                        }
                                      };
                                      setRolePermissions(updated);
                                      saveStoreValue("rolePermissions", updated);
                                    }
                                  }}
                                  disabled={loggedInUser?.role !== "Admin"}
                                />
                                <div className="block bg-slate-850 border border-slate-700 w-full h-full rounded-full peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all"></div>
                                <div className="absolute left-[2px] top-[2px] bg-slate-400 w-4 h-4 rounded-full transition-all peer-checked:translate-x-full peer-checked:bg-white"></div>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {/* Elegant Vertical Divider Line */}
                      <div className="hidden md:block w-[1px] bg-slate-800 self-stretch" />

                      <div className="flex-1 space-y-3.5">
                        {rightColumn.map(({ key, label }) => {
                          const value = rolePermissions ? (rolePermissions[targetRole]?.[key] ?? DEFAULT_ROLE_PERMISSIONS[targetRole]?.[key] ?? false) : false;
                          const isKeyInSelectedGroup = currentSubTab === "All" || (
                            PERMISSION_GROUPS[currentSubTab as "Ad" | "V" | "D" | "Ed"]?.some(item => item.key === key)
                          );
                          return (
                            <label key={key} className="flex items-center justify-between group cursor-pointer py-0.5 select-none transition-all duration-300 opacity-100">
                              <span className={`text-xs font-semibold transition-colors ${
                                currentSubTab !== "All" && isKeyInSelectedGroup
                                  ? "text-emerald-400 font-extrabold"
                                  : "text-slate-200 group-hover:text-white"
                              }`}>
                                {label}
                              </span>
                              <div className="relative inline-block w-10 h-5 shrink-0">
                                <input 
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={value as boolean}
                                  onChange={(e) => {
                                    if (setRolePermissions && rolePermissions) {
                                      const updated = {
                                        ...rolePermissions,
                                        [targetRole]: {
                                          ...(DEFAULT_ROLE_PERMISSIONS[targetRole] || {}),
                                          ...(rolePermissions[targetRole] || {}),
                                          [key]: e.target.checked
                                        }
                                      };
                                      setRolePermissions(updated);
                                      saveStoreValue("rolePermissions", updated);
                                    }
                                  }}
                                  disabled={loggedInUser?.role !== "Admin"}
                                />
                                <div className="block bg-slate-850 border border-slate-700 w-full h-full rounded-full peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all"></div>
                                <div className="absolute left-[2px] top-[2px] bg-slate-400 w-4 h-4 rounded-full transition-all peer-checked:translate-x-full peer-checked:bg-white"></div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {loggedInUser?.role !== "Admin" && (
                <p className="text-[10px] text-red-400 mt-2 italic">
                  {language === "bn" ? "* শুধুমাত্র এডমিন পারমিশন পরিবর্তন করতে পারবেন।" : "* Only Admin can change permissions."}
                </p>
              )}
            </div>
          </div>

        </div>
      </div> {/* End Role Permissions Tab */}

      {/* ===================== TAB: ACTIVE DEVICES ===================== */}
      <div className={activeTab === "active_devices" ? "space-y-6 block animate-fade-in" : "hidden"}>
        <div className="bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <span>{language === "bn" ? "অ্যাক্টিভ লগইন সেশন" : "Active Login Sessions"}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === "bn" ? "কোন কোন ডিভাইস থেকে ওয়েবসাইটে লগইন করা আছে তার তালিকা দেখুন।" : "View and manage devices currently logged into the system."}
            </p>
          </div>

          {/* STATS OVERVIEW SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stat 1: Total Active Sessions */}
            <div 
              onClick={() => setShowSessionsList(prev => !prev)}
              className="bg-slate-950/40 border border-slate-800/60 hover:border-cyan-500/30 hover:bg-slate-900/40 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 active:scale-[0.98] select-none"
              title={language === "bn" ? "অ্যাক্টিভ সেশন দেখতে ক্লিক করুন" : "Click to toggle active sessions list"}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all duration-500"></div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    {language === "bn" ? "সর্বমোট সক্রিয় সেশন" : "Total Active Sessions"}
                  </p>
                  <p className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                    {activeSessionsList.length} <span className="text-xs font-bold text-slate-400">{language === "bn" ? "টি" : "Devices"}</span>
                  </p>
                </div>
              </div>
              <div className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-lg shrink-0 transition-all duration-300">
                {showSessionsList ? (language === "bn" ? "লুকান ▲" : "Hide ▲") : (language === "bn" ? "দেখুন ▼" : "View ▼")}
              </div>
            </div>

            {/* Stat 2: Unique Active Users */}
            <div 
              onClick={() => setShowSessionsList(prev => !prev)}
              className="bg-slate-950/40 border border-slate-800/60 hover:border-emerald-500/30 hover:bg-slate-900/40 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 active:scale-[0.98] select-none"
              title={language === "bn" ? "অ্যাক্টিভ সেশন দেখতে ক্লিক করুন" : "Click to toggle active sessions list"}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    {language === "bn" ? "লগইন করা ব্যবহারকারী" : "Logged-in Users"}
                  </p>
                  <p className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                    {new Set(activeSessionsList.map(s => s.username)).size} <span className="text-xs font-bold text-slate-400">{language === "bn" ? "জন" : "Users"}</span>
                  </p>
                </div>
              </div>
              <div className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg shrink-0 transition-all duration-300">
                {showSessionsList ? (language === "bn" ? "লুকান ▲" : "Hide ▲") : (language === "bn" ? "দেখুন ▼" : "View ▼")}
              </div>
            </div>

            {/* Stat 3: Total Registered Accounts */}
            <div 
              onClick={() => setShowSessionsList(prev => !prev)}
              className="bg-slate-950/40 border border-slate-800/60 hover:border-indigo-500/30 hover:bg-slate-900/40 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 active:scale-[0.98] select-none"
              title={language === "bn" ? "অ্যাক্টিভ সেশন দেখতে ক্লিক করুন" : "Click to toggle active sessions list"}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all duration-500"></div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <UserPlus className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    {language === "bn" ? "নিবন্ধিত অ্যাকাউন্ট" : "Registered Accounts"}
                  </p>
                  <p className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                    {usersList.length} <span className="text-xs font-bold text-slate-400">{language === "bn" ? "জন" : "Users"}</span>
                  </p>
                </div>
              </div>
              <div className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-lg shrink-0 transition-all duration-300">
                {showSessionsList ? (language === "bn" ? "লুকান ▲" : "Hide ▲") : (language === "bn" ? "দেখুন ▼" : "View ▼")}
              </div>
            </div>
          </div>

          {showSessionsList && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              {activeSessionsList.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500 bg-slate-950/20 border border-slate-800/50 rounded-2xl">
                  {language === "bn" ? "কোনো অ্যাক্টিভ সেশন পাওয়া যায়নি।" : "No active sessions found."}
                </div>
              ) : (
                activeSessionsList.map((session) => (
                  <div key={session.id} className="bg-slate-900 border border-slate-750 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                          <Smartphone className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            {session.username}
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                              {session.role}
                            </span>
                            {localStorage.getItem("ALW_DEVICE_ID") === session.id && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {language === "bn" ? "এই ডিভাইস" : "Current Device"}
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">{session.deviceInfo}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950/50 rounded-xl p-3 text-[11px] text-slate-400 flex flex-col gap-1.5 border border-slate-800/50">
                      <div className="flex justify-between items-center border-b border-slate-800/30 pb-1.5 mb-0.5">
                        <span>{language === "bn" ? "ইউজার নেম:" : "Username:"}</span>
                        <span className="text-slate-200 font-mono font-bold">
                          {session.username}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-800/30 pb-1.5 mb-0.5">
                        <span>{language === "bn" ? "পাসওয়ার্ড:" : "Password:"}</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {session.passwordPlain || usersList.find((u: any) => u.username === session.username)?.passwordPlain || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>{language === "bn" ? "লগইন সময়:" : "Login Time:"}</span>
                        <span className="text-slate-300 font-medium">
                          {new Date(session.loginTime).toLocaleString(language === "bn" ? "bn-BD" : "en-US")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>{language === "bn" ? "শেষ অ্যাক্টিভিটি:" : "Last Active:"}</span>
                        <span className="text-cyan-400 font-medium">
                          {new Date(session.lastActive).toLocaleString(language === "bn" ? "bn-BD" : "en-US")}
                        </span>
                      </div>
                    </div>
                    
                    {localStorage.getItem("ALW_DEVICE_ID") !== session.id && (
                      <button 
                        onClick={() => {
                          if (window.confirm(language === "bn" ? "আপনি কি নিশ্চিত এই ডিভাইসটি লগআউট করতে চান?" : "Are you sure you want to log out this device?")) {
                            const updated = activeSessionsList.filter(s => s.id !== session.id);
                            setActiveSessionsList(updated);
                            localStorage.setItem("ALW_LOGIN_SESSIONS", JSON.stringify(updated));
                            deleteDocument("sessions", session.id).catch((err) => {
                              console.warn("Failed to delete session from cloud database:", err);
                            });
                          }
                        }}
                        className="absolute top-4 right-4 text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 p-2 rounded-lg transition-all active:scale-95 cursor-pointer"
                        title="Force Logout"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===================== TAB: DATABASE ===================== */}
      <div className={activeTab === "database" ? "space-y-6 block animate-fade-in" : "hidden"}>

      {/* Database utilities segment */}
      <div className="bg-[#1E293B]/40 border border-[#334155] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-150 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>{t.utilityT}</span>
        </h3>
        <p className="text-slate-400 leading-relaxed max-w-2xl">
          {t.utilityDesc}
        </p>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 flex items-start gap-2 max-w-xl">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t.alertWipe}</span>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={handleHardReset}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-slate-50 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.resetBtn}</span>
          </button>

          <button
            onClick={handleSeedMockReports}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>{t.seedBtn}</span>
          </button>
        </div>
      </div>

      {/* DEVICE LOCAL STORAGE BACKUP & RESTORE MODULE (USER WILL NEVER LOSE DATA ON PHONE/LAPTOP/TABLET) */}
      <div className="bg-[#1E293B]/60 border border-[#334155] rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <span className="text-xl">💾</span>
            <span>
              {language === "bn" 
                ? "ডিভাইস লোকাল স্টোরেজ ব্যাকআপ ও রিস্টোর সিস্টেম" 
                : "Trusted Device Storage Backup & Restore Ledger"}
            </span>
          </h3>
          <p className="text-[11px] text-slate-450 mt-1 leading-relaxed">
            {language === "bn"
              ? "আপনার মোবাইল, ল্যাপটপ বা ট্যাবলেটের নিজস্ব মেমোরির সাথে ডাটা সুরক্ষিত রাখতে ব্যাকআপ ফাইল ডাউনলোড করে রাখুন। ব্রাউজার ক্যাশে ডিলিট হয়ে গেলেও ফাইল আপলোড করে এক ক্লিকে সম্পূর্ণ রিপোর্ট ও ডাটা ফেরত আনতে পারবেন।"
              : "Ensure zero data loss. Save a copy of your entire ledger, reports, chemistry requisition sheets, and custom settings directly into your device storage (phone, tab or computer)."}
          </p>
        </div>

        {/* Database Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="block text-[9px] uppercase font-mono tracking-wider text-slate-500">{language === "bn" ? "সার্ভিস রিপোর্ট" : "Reports"}</span>
            <span className="block text-lg font-black text-emerald-400 mt-1 font-mono">{reports.length}</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="block text-[9px] uppercase font-mono tracking-wider text-slate-500">{language === "bn" ? "কেমিক্যাল রিকুইজিশন" : "Requisitions"}</span>
            <span className="block text-lg font-black text-blue-400 mt-1 font-mono">{getRequisitionsCount()}</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="block text-[9px] uppercase font-mono tracking-wider text-slate-500">{language === "bn" ? "ইঞ্জিনিয়ারিং লগ" : "Eng. Logs"}</span>
            <span className="block text-lg font-black text-amber-400 mt-1 font-mono">{getEngineeringReportsCount()}</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80 text-center">
            <span className="block text-[9px] uppercase font-mono tracking-wider text-slate-500">{language === "bn" ? "নিবন্ধিত লোকেশন" : "Locations"}</span>
            <span className="block text-lg font-black text-fuchsia-400 mt-1 font-mono">{getLocationsCount()}</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80 text-center col-span-2 md:col-span-1">
            <span className="block text-[9px] uppercase font-mono tracking-wider text-slate-500">{language === "bn" ? "সুপারভাইজার" : "Supervisors"}</span>
            <span className="block text-lg font-black text-teal-400 mt-1 font-mono">{getSupervisorsCount()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 border-t border-[#334155]/40">
          {/* Export button */}
          <button
            type="button"
            onClick={handleExportDatabase}
            className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <span>📥</span>
            <span>{language === "bn" ? "ব্যাকআপ ফাইল ডাউনলোড করুন (Export JSON)" : "Download Database Backup File (JSON)"}</span>
          </button>

          {/* Import custom trigger */}
          <label className="flex-1 sm:flex-none relative flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-extrabold rounded-2xl border border-slate-700 transition cursor-pointer text-center active:scale-95">
            <span>📤</span>
            <span>{language === "bn" ? "ব্যাকআপ রিস্টোর করুন (Import JSON)" : "Upload & Restore Database (JSON)"}</span>
            <input
              type="file"
              accept=".json"
              multiple
              onChange={handleImportDatabase}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>

        {/* INTERACTIVE FIREBASE CLOUD CONTROLLER */}
        <div className="bg-[#1E293B]/60 border border-[#334155] rounded-3xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#334155]/50 pb-3">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span className="text-base animate-pulse">🔥</span>
                <span>{language === "bn" ? "ফায়ারবেস রিয়েল-টাইম ক্লাউড ডেটাবেস কন্ট্রোলার" : "Firebase Real-time Cloud Sync Controller"}</span>
              </h4>
              <p className="text-[10px] text-slate-400">
                {language === "bn" ? "যেকোনো ফায়ারবেস কনফিগারেশন বসিয়ে সরাসরি ক্লাউড ডাটাবেস লাইভ করুন।" : "Paste and initialize any Firebase client key to establish an instant serverless backplane."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {fbSectionUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    setFbSectionUnlocked(false);
                    setFbSectionPassword("");
                  }}
                  className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-500/15 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1 active:scale-95"
                >
                  <Lock className="w-3 h-3" />
                  <span>{language === "bn" ? "লক করুন" : "Lock"}</span>
                </button>
              )}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold font-mono border ${
                fbActive 
                  ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20" 
                  : "bg-amber-950/30 text-amber-500 border-amber-500/20"
              }`}>
                <span className={`w-2 h-2 rounded-full ${fbActive ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
                <span>{fbActive ? (language === "bn" ? "সংযুক্ত / ক্লাউড সক্রিয়" : "Active / Live Cloud") : (language === "bn" ? "অফলাইন ক্যাশে মোড" : "Offline Replicated Cache")}</span>
              </span>
            </div>
          </div>

          {!fbSectionUnlocked ? (
            <div className="py-2 space-y-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-950/30 p-4 rounded-2xl border border-slate-800/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl mt-0.5 shrink-0">
                    <Lock className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-extrabold text-slate-200">
                      {language === "bn" ? "কন্ট্রোলারটি সুরক্ষিত অবস্থায় লক করা আছে" : "Cloud Controller is Secured & Locked"}
                    </h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-md">
                      {language === "bn" 
                        ? "এই কনফিগারেশন প্যানেলটি পরিবর্তন করতে আপনার অ্যাডমিন সিকিউরিটি পাসওয়ার্ড দিয়ে আনলক করুন।" 
                        : "To access or modify the cloud synchronization configuration, please enter your Admin password."}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUnlockFbSection} className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <input
                    type="password"
                    value={fbSectionPassword}
                    onChange={(e) => {
                      setFbSectionPassword(e.target.value);
                      if (fbSectionUnlockError) setFbSectionUnlockError(null);
                    }}
                    placeholder={language === "bn" ? "পাসওয়ার্ড লিখুন" : "Enter Password"}
                    className="bg-slate-950 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-[11px] font-bold text-center tracking-widest focus:border-amber-500 outline-none transition w-full md:w-44 shadow-inner"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 shrink-0"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{language === "bn" ? "আনলক" : "Unlock"}</span>
                  </button>
                </form>
              </div>

              {fbSectionUnlockError && (
                <div className="p-2.5 bg-red-950/25 border border-red-500/15 rounded-xl text-red-400 text-[10px] font-bold flex items-center gap-1.5 animate-fade-in">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span>{fbSectionUnlockError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {fbErrorMsg && (
                <div className="p-3 bg-red-950/20 border border-red-500/10 rounded-xl text-red-400 text-[10px] font-mono leading-relaxed">
                  <strong>Error:</strong> {fbErrorMsg}
                </div>
              )}

              {fbSaveSuccess && (
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-[10px] font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                  <span>{language === "bn" ? "ফায়ারবেস কনফিগারেশন সফলভাবে সেভ ও লাইভ করা হয়েছে!" : "Firebase credential registered and cloud environment mounted successfully!"}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-300 font-mono uppercase tracking-wider">
                  {language === "bn" ? "ফায়ারবেস কনফিগারেশন JSON:" : "Paste Firebase SDK Configuration Object (JSON):"}
                </label>
                <textarea
                  value={fbConfigStr}
                  onChange={(e) => setFbConfigStr(e.target.value)}
                  placeholder={`{
  "apiKey": "YOUR-API-KEY",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}`}
                  rows={6}
                  className="w-full bg-slate-950 text-slate-250 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-2xl p-4 font-mono text-[10px] outline-none transition leading-relaxed resize-none shadow-inner"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveFirebaseConfig}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-50 font-extrabold text-[11px] rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === "bn" ? "কানেক্ট ও সিঙ্ক করুন" : "Save & Sync Cloud"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetFirebaseConfig}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[11px] rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-700 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === "bn" ? "লোকাল মোডে ফিরুন" : "Reset to Local Mode"}</span>
                  </button>
                </div>

                {fbActive && (
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={fbSyncing}
                    className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-extrabold text-[11px] rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${fbSyncing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${fbSyncing ? "animate-spin" : ""}`} />
                    <span>{fbSyncing ? (language === "bn" ? "সিঙ্ক হচ্ছে..." : "Syncing Ledger...") : (language === "bn" ? "এখনই ক্লাউড সিঙ্ক করুন" : "Sync Now")}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOHAP legal rules block */}
      <div className="bg-slate-905 border border-slate-800 rounded-3xl p-6 space-y-3">
        <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-[#10B981]" />
          <span>{t.rulesTitle}</span>
        </h4>
        <p className="text-slate-400 italic leading-relaxed">
          {t.ruleDesc}
        </p>
      </div>



      </div> {/* End Database Tab */}

        </div> {/* End Right Side Settings Details Panel */}
      </div> {/* End 2-Column Dashboard Layout */}

      {/* CUSTOM STATE-BASED POPUPS & DIALOGS */}
      {/* 1. Account Deletion Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[#fadeIn_0.2s_ease-out]">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-left">
            <div className="p-3 bg-red-550/10 text-red-400 rounded-2xl w-fit border border-red-555/20 mx-auto">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="text-center space-y-1.5">
              <h4 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                {language === "bn" ? "অ্যাকাউন্ট মুছে ফেলার নিশ্চিতকরণ" : "Confirm Account Deletion"}
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {language === "bn" 
                  ? `আপনি কি নিশ্চিত যে আপনি '${userToDelete.username}' অ্যাকাউন্টটি চিরতরে মুছে ফেলতে চান?` 
                  : `Are you sure you want to permanently delete the profile for '${userToDelete.username}'?`}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition cursor-pointer text-center"
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="flex-1 py-2.5 bg-red-655 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer text-center"
              >
                {language === "bn" ? "হ্যাঁ, মুছুন" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Admin Protected Account Warning Dialog */}
      {adminLockError && (
        <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[#fadeIn_0.2s_ease-out]">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl w-fit border border-amber-500/20 mx-auto">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                {language === "bn" ? "সংরক্ষিত সিস্টেম অ্যাকাউন্ট" : "Protected System Account"}
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {adminLockError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAdminLockError(null)}
              className="w-full py-2.5 bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition cursor-pointer"
            >
              {language === "bn" ? "ঠিক আছে" : "OK"}
            </button>
          </div>
        </div>
      )}

      {/* 3. Hard Reset Database Confirmation Dialog */}
      {showHardResetConfirm && (
        <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[#fadeIn_0.2s_ease-out]">
          <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-left">
            <div className="p-3 bg-red-550/10 text-red-400 rounded-2xl w-fit border border-red-555/20 mx-auto">
              <RotateCcw className="w-6 h-6 animate-spin-slow" />
            </div>
            
            <div className="text-center space-y-2">
              <h4 className="text-sm font-black text-slate-100 uppercase tracking-wider text-red-500">
                ⚠️ {language === "bn" ? "ডাটাবেজ রিসেট নিশ্চিতকরণ" : "Confirm Clear Database"}
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {language === "bn" 
                  ? "আপনি কি নিশ্চিত যে আপনার ব্রাউজার মেমোরির সমস্ত হিস্টোরি এবং সার্ভিস রিপোর্ট রিসেট করতে চান? এই কাজ ফিরিয়ে আনা যাবে না।" 
                  : "Are you sure you want to hard delete all operations historical ledger data in this browser? This action cannot be undone."}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowHardResetConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition cursor-pointer text-center"
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHardResetConfirm(false);
                  onUpdateReports([]);
                  localStorage.removeItem("ALW_STARE_ERP_REPORTS");
                  setSuccessMsg(t.successReset);
                  setTimeout(() => {
                    setSuccessMsg(null);
                    window.location.reload();
                  }, 1500);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer text-center"
              >
                {language === "bn" ? "রিসেট করুন" : "Yes, Hard Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
