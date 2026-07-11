export type AppLanguage = "en" | "ar" | "bn";

export interface ChemicalRef {
  name: string;
  dilution: string;
  batch: string;
  expiry: string;
  stock: number;
  unit: string;
  alertThreshold: number;
}

export interface ClientDirectoryItem {
  name: string;
  centerId: string;
  emirate: string;
}

export interface ReportItem {
  id: string;
  facilityName: string;
  clientId: string;
  contractNo: string;
  branchName: string;
  facilityType: string;
  emirate: "Ajman" | "Dubai" | "Sharjah" | "Umm Al Quwain" | "Ras Al Khaimah" | "Fujairah" | "Al Dhaid" | string;
  address: string;
  gpsCoordinates?: string;
  contactPerson: string;
  mobile: string;
  whatsapp: string;
  email: string;
  startDate: string;
  endDate: string;
  validity: string;
  dateOfOperation: string;
  ticketNo: string;
  startTime: string;
  endTime: string;
  duration: string;
  categories: string[];
  areas: string[];
  reportText: string;
  partialNotes?: string;
  workStatus: "Completed" | "In Progress" | "Follow-Up Required" | "Emergency Callback" | "Partially Completed";
  methods: string[];
  chemicals: {
    name: string;
    dilution: string;
    used: string;
    batch: string;
    expiry: string;
    remaining: string;
    quantityPcs?: number | string;
    storeRetrievalDate?: string;
    disposalDate?: string;
    disposalQty?: number | string;
  }[];
  infestation: Record<string, "None" | "Low" | "Medium" | "High" | string>;
  sanitation: "Poor" | "Satisfactory" | "Good";
  proofing: "Poor" | "Satisfactory" | "Good";
  sanitationRemarks?: string;
  proofingRemarks?: string;
  recommendations: string[];
  billing: {
    invoiceNo: string;
    invoiceDate: string;
    amount: number | string;
    discount: number;
    vat: number;
    total: number;
    method: "Cash" | "Bank Transfer" | "Card Payment" | "Online Payment" | string;
    status: "Paid" | "Pending" | "Partial Payment" | "Overdue";
  };
  technicians: string[];
  signatures: {
    client?: string;
    technician?: string;
    supervisor?: string;
  };
  createdBy?: {
    username: string;
    role?: string;
    avatarColor?: string;
  };
  media?: {
    beforePhotos?: string[];
    afterPhotos?: string[];
    chemicalPhotos?: string[];
    attendancePhotos?: string[];
    sitePhotos?: string[];
  };
  dateFrame?: string;
  locationType?: string;
  instructionText?: string;
  routeId?: string;
  sectionServiced?: string;
  additionalChemical?: string;
  chemicalAmount?: string;
  assignedCleanLead?: string;
  supervisingLeadOfficer?: string;
  comments?: string;
  rawEngineeringData?: any;
  updatedAt?: number;
}

export interface AppUser {
  id: string;
  username: string;
  passwordPlain: string;
  role: "Admin" | "Moderator" | "Visitor" | "Acting Leader";
  customPermissionsEnabled?: boolean;
  customPermissions?: {
    serviceReport?: "None" | "View" | "Edit" | "Delete";
    engineeringReport?: "None" | "View" | "Edit" | "Delete";
    inventory?: "None" | "View" | "Edit" | "Delete";
    technicians?: "None" | "View" | "Edit" | "Delete";
    scheduler?: "None" | "View" | "Edit" | "Delete";
    clientDirectory?: "None" | "View" | "Edit" | "Delete";
    [key: string]: any;
  };
  allowedEmirates?: string[];
  profilePic?: string;
  fullName?: string;
}

export interface LoginSession {
  id: string; // Unique device/session ID
  userId: string;
  username: string;
  role: string;
  deviceInfo: string;
  loginTime: string;
  lastActive: string;
  passwordPlain?: string;
}

export interface RolePermissions {
  canCreateReport: boolean;
  canEditReport: boolean;
  canDeleteReport: boolean;
  canManageLocations: boolean;
  canManageSupervisors: boolean;
  canManageInventory: boolean;
  canManageTechnicians: boolean;
  canManageScheduler: boolean;
  canManageEngineeringReport: boolean;
  canViewDashboard: boolean;
  canViewCompletedRegistry: boolean;
  canViewLocations: boolean;
  canViewSupervisors: boolean;
  canViewDirectory: boolean;
  canViewEngineeringReport: boolean;
  canViewMasterForm: boolean;
  canViewInventory: boolean;
  canViewTechnicians: boolean;
  canViewAIPest: boolean;
  canViewClientPortal: boolean;
  canViewScheduler: boolean;

  // New Granular Permissions for Ad (Add), Ed (Edit), D (Delete)
  canCreateLocation?: boolean;
  canEditLocation?: boolean;
  canDeleteLocation?: boolean;

  canCreateSupervisor?: boolean;
  canEditSupervisor?: boolean;
  canDeleteSupervisor?: boolean;

  canCreateInventory?: boolean;
  canEditInventory?: boolean;
  canDeleteInventory?: boolean;

  canCreateTechnician?: boolean;
  canEditTechnician?: boolean;
  canDeleteTechnician?: boolean;

  canCreateScheduler?: boolean;
  canEditScheduler?: boolean;
  canDeleteScheduler?: boolean;

  canCreateEngineeringReport?: boolean;
  canEditEngineeringReport?: boolean;
  canDeleteEngineeringReport?: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  Admin: {
    canCreateReport: true,
    canEditReport: true,
    canDeleteReport: true,
    canManageLocations: true,
    canManageSupervisors: true,
    canManageInventory: true,
    canManageTechnicians: true,
    canManageScheduler: true,
    canManageEngineeringReport: true,
    canViewDashboard: true,
    canViewCompletedRegistry: true,
    canViewLocations: true,
    canViewSupervisors: true,
    canViewDirectory: true,
    canViewEngineeringReport: true,
    canViewMasterForm: true,
    canViewInventory: true,
    canViewTechnicians: true,
    canViewAIPest: true,
    canViewClientPortal: true,
    canViewScheduler: true,

    canCreateLocation: true,
    canEditLocation: true,
    canDeleteLocation: true,

    canCreateSupervisor: true,
    canEditSupervisor: true,
    canDeleteSupervisor: true,

    canCreateInventory: true,
    canEditInventory: true,
    canDeleteInventory: true,

    canCreateTechnician: true,
    canEditTechnician: true,
    canDeleteTechnician: true,

    canCreateScheduler: true,
    canEditScheduler: true,
    canDeleteScheduler: true,

    canCreateEngineeringReport: true,
    canEditEngineeringReport: true,
    canDeleteEngineeringReport: true,
  },
  Moderator: {
    canCreateReport: true,
    canEditReport: true,
    canDeleteReport: false,
    canManageLocations: false,
    canManageSupervisors: false,
    canManageInventory: true,
    canManageTechnicians: true,
    canManageScheduler: true,
    canManageEngineeringReport: true,
    canViewDashboard: true,
    canViewCompletedRegistry: true,
    canViewLocations: true,
    canViewSupervisors: true,
    canViewDirectory: true,
    canViewEngineeringReport: true,
    canViewMasterForm: true,
    canViewInventory: true,
    canViewTechnicians: true,
    canViewAIPest: true,
    canViewClientPortal: true,
    canViewScheduler: true,

    canCreateLocation: false,
    canEditLocation: false,
    canDeleteLocation: false,

    canCreateSupervisor: false,
    canEditSupervisor: false,
    canDeleteSupervisor: false,

    canCreateInventory: true,
    canEditInventory: true,
    canDeleteInventory: true,

    canCreateTechnician: true,
    canEditTechnician: true,
    canDeleteTechnician: true,

    canCreateScheduler: true,
    canEditScheduler: true,
    canDeleteScheduler: true,

    canCreateEngineeringReport: true,
    canEditEngineeringReport: true,
    canDeleteEngineeringReport: true,
  },
  "Acting Leader": {
    canCreateReport: true,
    canEditReport: true,
    canDeleteReport: false,
    canManageLocations: false,
    canManageSupervisors: false,
    canManageInventory: true,
    canManageTechnicians: true,
    canManageScheduler: true,
    canManageEngineeringReport: true,
    canViewDashboard: true,
    canViewCompletedRegistry: true,
    canViewLocations: true,
    canViewSupervisors: true,
    canViewDirectory: true,
    canViewEngineeringReport: true,
    canViewMasterForm: true,
    canViewInventory: true,
    canViewTechnicians: true,
    canViewAIPest: true,
    canViewClientPortal: true,
    canViewScheduler: true,

    canCreateLocation: false,
    canEditLocation: false,
    canDeleteLocation: false,

    canCreateSupervisor: false,
    canEditSupervisor: false,
    canDeleteSupervisor: false,

    canCreateInventory: true,
    canEditInventory: true,
    canDeleteInventory: true,

    canCreateTechnician: true,
    canEditTechnician: true,
    canDeleteTechnician: true,

    canCreateScheduler: true,
    canEditScheduler: true,
    canDeleteScheduler: true,

    canCreateEngineeringReport: true,
    canEditEngineeringReport: true,
    canDeleteEngineeringReport: true,
  },
  Visitor: {
    canCreateReport: false,
    canEditReport: false,
    canDeleteReport: false,
    canManageLocations: false,
    canManageSupervisors: false,
    canManageInventory: false,
    canManageTechnicians: false,
    canManageScheduler: false,
    canManageEngineeringReport: false,
    canViewDashboard: true,
    canViewCompletedRegistry: true,
    canViewLocations: true,
    canViewSupervisors: true,
    canViewDirectory: true,
    canViewEngineeringReport: true,
    canViewMasterForm: true,
    canViewInventory: true,
    canViewTechnicians: true,
    canViewAIPest: true,
    canViewClientPortal: true,
    canViewScheduler: true,

    canCreateLocation: false,
    canEditLocation: false,
    canDeleteLocation: false,

    canCreateSupervisor: false,
    canEditSupervisor: false,
    canDeleteSupervisor: false,

    canCreateInventory: false,
    canEditInventory: false,
    canDeleteInventory: false,

    canCreateTechnician: false,
    canEditTechnician: false,
    canDeleteTechnician: false,

    canCreateScheduler: false,
    canEditScheduler: false,
    canDeleteScheduler: false,

    canCreateEngineeringReport: false,
    canEditEngineeringReport: false,
    canDeleteEngineeringReport: false,
  }
};

export function getCurrentUserPermissions(): RolePermissions {
  const loggedInUserStrRaw = localStorage.getItem("ALW_STAR_LOGGED_IN_USER") || sessionStorage.getItem("ALW_STAR_LOGGED_IN_USER") || localStorage.getItem("ALW_LOGGED_IN_USER_V2");
  let loggedInUser: AppUser | null = null;
  if (loggedInUserStrRaw) {
    try { loggedInUser = JSON.parse(loggedInUserStrRaw); } catch (e) {}
  }

  // Look up freshest data from central users list to prevent stale session permissions
  if (loggedInUser) {
    const usersStr = localStorage.getItem("ALW_STAR_USERS");
    if (usersStr) {
      try {
        const usersList = JSON.parse(usersStr) as AppUser[];
        const freshUser = usersList.find(u => u.username.toLowerCase() === loggedInUser!.username.toLowerCase() || u.id === loggedInUser!.id);
        if (freshUser) {
          loggedInUser = { ...loggedInUser, ...freshUser };
        }
      } catch (e) {}
    }
  }
  
  const storedPermsRaw = localStorage.getItem("ALW_ROLE_PERMISSIONS");
  let rolePermissions = DEFAULT_ROLE_PERMISSIONS;
  if (storedPermsRaw) {
    try { rolePermissions = JSON.parse(storedPermsRaw); } catch (e) {}
  }
  
  const role = loggedInUser?.role || "Visitor";
  const basePerms = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.Visitor;
  const userPerms = rolePermissions[role] || {};
  const perms = { ...basePerms, ...userPerms };

  // Apply individual custom permissions if enabled
  if (loggedInUser && loggedInUser.customPermissionsEnabled && loggedInUser.customPermissions) {
    const cp = loggedInUser.customPermissions;

    // Check if the customPermissions contains direct permission keys (e.g. canCreateReport)
    let hasDirectFlags = false;
    for (const key of Object.keys(cp)) {
      if (key.startsWith("can")) {
        hasDirectFlags = true;
        break;
      }
    }

    if (hasDirectFlags) {
      for (const [k, v] of Object.entries(cp)) {
        if (k.startsWith("can") && typeof v === "boolean") {
          (perms as any)[k] = v;
        }
      }
      // Align general canManage flags with newly updated direct granular flags
      perms.canManageLocations = !!(perms.canCreateLocation || perms.canEditLocation || perms.canDeleteLocation);
      perms.canManageSupervisors = !!(perms.canCreateSupervisor || perms.canEditSupervisor || perms.canDeleteSupervisor);
      perms.canManageInventory = !!(perms.canCreateInventory || perms.canEditInventory || perms.canDeleteInventory);
      perms.canManageTechnicians = !!(perms.canCreateTechnician || perms.canEditTechnician || perms.canDeleteTechnician);
      perms.canManageScheduler = !!(perms.canCreateScheduler || perms.canEditScheduler || perms.canDeleteScheduler);
      perms.canManageEngineeringReport = !!(perms.canCreateEngineeringReport || perms.canEditEngineeringReport || perms.canDeleteEngineeringReport);
    } else {
      // 1. Service Report
      if (cp.serviceReport) {
        const mode = cp.serviceReport;
        perms.canViewDashboard = mode !== "None";
        perms.canViewCompletedRegistry = mode !== "None";
        perms.canViewMasterForm = mode !== "None";
        perms.canCreateReport = mode === "Edit" || mode === "Delete";
        perms.canEditReport = mode === "Edit" || mode === "Delete";
        perms.canDeleteReport = mode === "Delete";
      }

      // 2. Engineering Report
      if (cp.engineeringReport) {
        const mode = cp.engineeringReport;
        perms.canViewEngineeringReport = mode !== "None";
        perms.canCreateEngineeringReport = mode === "Edit" || mode === "Delete";
        perms.canEditEngineeringReport = mode === "Edit" || mode === "Delete";
        perms.canDeleteEngineeringReport = mode === "Delete";
        perms.canManageEngineeringReport = mode === "Edit" || mode === "Delete";
      }

      // 3. Chemical Inventory
      if (cp.inventory) {
        const mode = cp.inventory;
        perms.canViewInventory = mode !== "None";
        perms.canCreateInventory = mode === "Edit" || mode === "Delete";
        perms.canEditInventory = mode === "Edit" || mode === "Delete";
        perms.canDeleteInventory = mode === "Delete";
        perms.canManageInventory = mode === "Edit" || mode === "Delete";
      }

      // 4. Technicians & Supervisors
      if (cp.technicians) {
        const mode = cp.technicians;
        perms.canViewTechnicians = mode !== "None";
        perms.canCreateTechnician = mode === "Edit" || mode === "Delete";
        perms.canEditTechnician = mode === "Edit" || mode === "Delete";
        perms.canDeleteTechnician = mode === "Delete";
        perms.canManageTechnicians = mode === "Edit" || mode === "Delete";

        perms.canViewSupervisors = mode !== "None";
        perms.canCreateSupervisor = mode === "Edit" || mode === "Delete";
        perms.canEditSupervisor = mode === "Edit" || mode === "Delete";
        perms.canDeleteSupervisor = mode === "Delete";
        perms.canManageSupervisors = mode === "Edit" || mode === "Delete";
      }

      // 5. Project Scheduler
      if (cp.scheduler) {
        const mode = cp.scheduler;
        perms.canViewScheduler = mode !== "None";
        perms.canCreateScheduler = mode === "Edit" || mode === "Delete";
        perms.canEditScheduler = mode === "Edit" || mode === "Delete";
        perms.canDeleteScheduler = mode === "Delete";
        perms.canManageScheduler = mode === "Edit" || mode === "Delete";
      }

      // 6. Client Directory
      if (cp.clientDirectory) {
        const mode = cp.clientDirectory;
        perms.canViewDirectory = mode !== "None";
        perms.canViewLocations = mode !== "None";
        perms.canCreateLocation = mode === "Edit" || mode === "Delete";
        perms.canEditLocation = mode === "Edit" || mode === "Delete";
        perms.canDeleteLocation = mode === "Delete";
        perms.canManageLocations = mode === "Edit" || mode === "Delete";
      }
    }
  }

  return perms;
}

export type UserRole = "Super Admin" | "Admin / Manager" | "Guest Admin" | "Client Portal" | "Moderator" | "Visitor" | "Admin" | "Acting Leader";

export const DICTIONARY: Record<AppLanguage, Record<string, string>> = {
  en: {
    appTitle: "AL WAFA STAR ERP",
    systemSubtitle: "Smart Pest Control & Medical Facility Management System",
    dashboard: "Dashboard",
    clientDirectory: "Location Directory",
    masterForm: "New Service Report",
    inventory: "Chemical Inventory",
    technicians: "Technicians",
    clientPortal: "Pest Control Service",
    aiPestDetection: "AI Pest Expert (Gemini)",
    addReportSuccess: "Report auto-filed successfully with real-time stock adjustment!",
    activeClients: "Active Clients",
    servicesCompleted: "Services Completed",
    revenue: "Total Revenue",
    pendingPayments: "Pending Payments",
    expiringContracts: "Expiring Contracts",
    infestationMonitoring: "Pest Infestation Monitoring",
    chemicalReference: "Chemical Usage Metrics",
    recentReports: "Recent Service Operations Logs",
    addReportBtn: "Open Dynamic Form",
    allRightsReserved: "Al Wafa Star ERP © 2026. All Rights Reserved."
  },
  ar: {
    appTitle: "الوفاء ستار ERP",
    systemSubtitle: "نظام ذكي لمكافحة الحشرات وإدارة المنشآت الطبية",
    dashboard: "لوحة التحكم",
    clientDirectory: "دليل المواقع",
    masterForm: "تقرير الخدمة الجديد",
    inventory: "مخزون المواد الكيميائية",
    technicians: "الفنيين والمشرفين",
    clientPortal: "خدمة مكافحة الآفات",
    aiPestDetection: "خبير الذكاء الاصطناعي (Gemini)",
    addReportSuccess: "تم حفظ التقرير بنجاح مع الخصم التلقائي للمخزون!",
    activeClients: "العملاء النشطين",
    servicesCompleted: "الخدمات المكتملة",
    revenue: "إجمالي الإيرادات",
    pendingPayments: "الدفعات المعلقة",
    expiringContracts: "العقود المنتهية قريباً",
    infestationMonitoring: "مراقبة مستوى انتشار الآفات",
    chemicalReference: "مؤشرات استهلاك المواد الكيميائية",
    recentReports: "سجلات عمليات الخدمة الأخيرة",
    addReportBtn: "فتح النموذج الديناميكي",
    allRightsReserved: "الوفاء ستار ERP © 2026. جميع الحقوق محفوظة."
  },
  bn: {
    appTitle: "আল ওয়াফা স্টার ERP",
    systemSubtitle: "স্মার্ট পেস্ট কন্ট্রোল এবং মেডিকেল ফেসিলিটি ম্যানেজমেন্ট সিস্টেম",
    dashboard: "ড্যাশবোর্ড",
    clientDirectory: "লোকেশন ডিরেক্টরি",
    masterForm: "নতুন সার্ভিস রিপোর্ট",
    inventory: "কেমিক্যাল ইনভেন্টরি",
    technicians: "টেকনিশিয়ান প্যানেল",
    clientPortal: "Pest Control Service",
    aiPestDetection: "AI পেস্ট এক্সপার্ট (Gemini)",
    addReportSuccess: "সার্ভিস রিপোর্ট সফলভাবে দাখিল করা হয়েছে এবং স্টক স্বয়ংক্রিয়ভাবে সমন্বয় করা হয়েছে!",
    activeClients: "মোট সক্রিয় ক্লায়েন্ট",
    servicesCompleted: "সম্পন্ন সার্ভিস সমূহ",
    revenue: "মোট রাজস্ব",
    pendingPayments: "বকেয়া পেমেন্ট",
    expiringContracts: "মেয়াদোত্তীর্ণ হতে নেওয়া চুক্তি",
    infestationMonitoring: "পোকা-মাকড় উপদ্রব নিরীক্ষণ",
    chemicalReference: "কেমিক্যাল স্টক ও ব্যবহারের হিসাব",
    recentReports: "সম্পন্ন হওয়া সাম্প্রতিক অপারেশন লগ",
    addReportBtn: "নতুন ফর্ম পূরণ করুন",
    allRightsReserved: "আল ওয়াফা স্টার ERP © ২০২৬। সর্বস্বত্ব সংরক্ষিত।"
  }
};

export interface LocationRegistryItem {
  id: string;
  name: string;
  emirate: string;
  mapUrl?: string;
}

export interface SupervisorRegistryItem {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  facilityName: string;
  emirate: string;
  avatarUrl?: string;
  avatarEmoji?: string;
}

export const EMIRATE_MAPPING_FACILITIES: Record<string, string[]> = {
  "ajman": [
    "Al Hamidiyah Health Center",
    "Public Health Center",
    "Dental Health Center",
    "Mushairif Health Center",
    "Maple Clinic",
    "Ajman Medical Store",
    "Ajman DTC",
    "Al Rashidiya Clinic"
  ],
  "dubai": [
    "Al Kuwait Hospital (Dubai)",
    "Hor Al Anz Health Center",
    "Smart Salem Medical Fitness Centre",
    "DTC Rashidiya",
    "ENOC Salem",
    "Erada Center",
    "Silicon Oasis Health Center",
    "Family Health Promotion Center",
    "Blood Transfusion Center"
  ],
  "sharjah": [
    "Al Kuwait Hospital (Sharjah)",
    "Khorfakkan Hospital",
    "Malaria Unit"
  ],
  "umm al quwain": [
    "Umm Al Quwain Hospital",
    "Al Khazan Health Center",
    "Falaj Al Mualla Health Center",
    "Al Rafa Health Center"
  ],
  "ras al khaimah": [
    "Abdullah Bin Omran Hospital",
    "Saqr Hospital",
    "Shaam Hospital"
  ],
  "fujairah": [
    "Fujairah Hospital",
    "Fujairah Medical Store"
  ],
  "al dhaid": [
    "Al Kuwait Hospital (Sharjah)",
    "Khorfakkan Hospital"
  ]
};

export const STANDARD_FACILITIES = [
  "GENETIC AND NEONATAL SCREENING DIAGNOSTIC CENTER.",
  "AL MADINA HEALTH CENTER -AJMAN",
  "AL MANAMA HEALTH CENTER -AJMAN",
  "MUZEIRAH HEALTH CENTER -AJMAN",
  "AL HAMIDIYA CLINIC-AJMAN",
  "PUBLIC HEALTH CENTER-AJMAN",
  "DENTAL CLINIC-AJMAN",
  "AL MUSHEIRIF HEALTH CENTER -AJMAN",
  "MEDICAL STORE -AJMAN",
  "MAPLE CLINIC - AL JURF",
  "MAPLE CLINIC - AL RAWDAH",
  "MAPLE RED PHARMACY - AL RAWDAH",
  "MAPLE RED PHARMACY - AL NUAMIA",
  "MAPLE RED PHARMACY - G+",
  "AL KUWAIT HOSPITAL",
  "AL AMAL PSYCHIATRIC HOSPITAL",
  "DTC",
  "EMARAT HEALTH SERVICE(SILICON)",
  "ERADA CENTER",
  "AL AWIR HEALTH CENTER",
  "AL ITTIHAD HEALTH CENTER",
  "DUBAI DENTAL SPECIALISED CENTER",
  "HOR AL ANZ HEALTH CENTER",
  "AL MUHAISNA HEALTH CENTER",
  "CENTRAL MEDICAL STORE",
  "NATIONAL RADIATION PROTECTION CENTER .",
  "PREVENTIVE MEDICINE(AL BARAHA)",
  "SMART SALEEM CITY WALK",
  "SMART SALEEM KNOWLADGE VILLAGE",
  "SMART SALEEM INDEX MALL",
  "ENOCK SALEEM MFC",
  "EMIRATES DRUG ESTABLISHMENT (LAB)",
  "MBRHE",
  "BUS WASH",
  "FUJAIRAH HOSPITAL",
  "FUJAIRAH MEDICAL STORE",
  "FUJAIRAH PUBLIC HEALTH CENTER",
  "ABDULLAH BIN OMRAN HOSPITAL",
  "SAQR HOSPITAL",
  "SHA'AM HOSPITAL",
  "AL MAERID HEALTH CENTER",
  "AL JEER HEALTH CENTER",
  "ABDULLAH BIN ALI AL HARHAN HEALTH CENTER",
  "AL JAZEERA AL HAMRAH HEALTH CENTER",
  "RAS AL KHAIMAH HEALTH CENTER",
  "AL NAKHEEL HEALTH CENTER",
  "EHS MEDICAL STORE - RAK",
  "EHS OFFICES - RAK",
  "PHYSIOTHERAPY & SPORTS CENTER",
  "RAK SPECIALIZED DENTAL CENTER",
  "KHORFAKKAN HOSPITAL",
  "KHORFAKKAN DENTAL CLINIC",
  "KALBA PUBLIC HEALTH",
  "KALBA DENTAL CENTER",
  "DIBBA PUBLIC HEALTH",
  "AL NAHWA HEALTH CENTER",
  "KUWAIT HOSPITAL- SHARJAH",
  "FAMILY HEALTH CENTER - SHARJAH",
  "BLOOD TRANSFUSION AND RESEARCH CENTER",
  "PUBLIC HEALTH CENTER",
  "NATIONAL MALARIA CLINIC",
  "EHS OFFICE",
  "AL DHAID HEALTH CENTER",
  "AL DHAIDPUBLIC HEALTH CENTER",
  "AL MALIHA HEALTH CENTER",
  "AL THAMEED HEALTH CENTER",
  "AL MADAM HEALTH CENTER",
  "NAZWA HEALTH CENTER",
  "UMM AL QUWAIN HOSPITAL",
  "KHAZAN HEALTH CENTER-UAQ",
  "DENTAL CLINIC -UAQ",
  "PUBLIC HEALTH CENTER -UAQ",
  "SALAMA HEALTH CENTER -UAQ",
  "FALAJ AL MUALLA HEALTH CENTER -UAQ",
  "RAFA HEALTH CENTER -UAQ"
];

