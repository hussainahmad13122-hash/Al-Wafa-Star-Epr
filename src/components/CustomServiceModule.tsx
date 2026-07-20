import React, { useState, useEffect } from "react";
import { ReportItem } from "../types";
import { 
  CheckCircle2, 
  Search, 
  Printer, 
  X,
  Edit3,
  Trash2,
  Calendar
} from "lucide-react";
import { generateReportHTML, generateEngineeringHTML, printHTMLContent, generateBulkReportsHTML } from "./ClientDirectory";
import EngineeringReport from "./EngineeringReport";
import { getDocuments, subscribeCollection } from "../localDatabase";

interface CustomServiceModuleProps {
  language: "en" | "bn" | "ar";
  isDark: boolean;
  reports?: ReportItem[];
  onEditReport?: (report: ReportItem) => void;
  onDeleteReport?: (id: string) => void;
  loggedInUser?: any;
}

const formatFacilityType = (type: string, lang: "en" | "ar" | "bn") => {
  if (!type) return "";
  if (type === "Completed") return lang === "bn" ? "কমপ্লিট" : "Completed";
  if (type === "Partially Completed" || type === "In Progress") return lang === "bn" ? "অর্ধেক করা হয়েছে" : "Partially Completed";
  if (type === "Incomplete" || type === "Not Started") return lang === "bn" ? "কমপ্লিট হয়নি" : "Incomplete";
  return type;
};

const getReportMonthAndYear = (dateStr?: string) => {
  if (!dateStr) return { month: -1, year: -1 };
  try {
    const trimmed = dateStr.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-\d{2}/);
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) // 1-12
      };
    }
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      return {
        year: parsedDate.getFullYear(),
        month: parsedDate.getMonth() + 1 // 1-12
      };
    }
  } catch (e) {}
  return { month: -1, year: -1 };
};

const monthsList = {
  en: [
    { value: "All", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ],
  bn: [
    { value: "All", label: "সব মাস" },
    { value: "1", label: "জানুয়ারি" },
    { value: "2", label: "ফেব্রুয়ারি" },
    { value: "3", label: "মার্চ" },
    { value: "4", label: "এপ্রিল" },
    { value: "5", label: "মে" },
    { value: "6", label: "জুন" },
    { value: "7", label: "জুলাই" },
    { value: "8", label: "আগস্ট" },
    { value: "9", label: "সেপ্টেম্বর" },
    { value: "10", label: "অক্টোবর" },
    { value: "11", label: "নভেম্বর" },
    { value: "12", label: "ডিসেম্বর" }
  ],
  ar: [
    { value: "All", label: "جميع الأشهر" },
    { value: "1", label: "يناير (كانون الثاني)" },
    { value: "2", label: "فبراير (شباط)" },
    { value: "3", label: "مارس (آذار)" },
    { value: "4", label: "أبريل (نيسان)" },
    { value: "5", label: "مايو (أيار)" },
    { value: "6", label: "يونيو (حزيران)" },
    { value: "7", label: "يوليو (تموز)" },
    { value: "8", label: "أغسطس (آب)" },
    { value: "9", label: "سبتمبر (أيلول)" },
    { value: "10", label: "أكتوبر (تشرين الأول)" },
    { value: "11", label: "نوفمبر (تشرين الثاني)" },
    { value: "12", label: "ديسمبر (كانون الأول)" }
  ]
};

export default function CustomServiceModule({ language, isDark, reports = [], onEditReport, onDeleteReport, loggedInUser: propLoggedInUser }: CustomServiceModuleProps) {
  const loggedInUserStrRaw = localStorage.getItem("ALW_STAR_LOGGED_IN_USER") || sessionStorage.getItem("ALW_STAR_LOGGED_IN_USER") || localStorage.getItem("ALW_LOGGED_IN_USER_V2");
  let localLoggedInUser = null;
  if (loggedInUserStrRaw) {
    try {
      localLoggedInUser = JSON.parse(loggedInUserStrRaw);
    } catch(err) {}
  }
  const loggedInUser = propLoggedInUser || localLoggedInUser;
  const userAllowedEmirates = loggedInUser?.allowedEmirates || [];
  const hasRegionalRestriction = loggedInUser?.role !== "Admin" && userAllowedEmirates.length > 0;

  const [completedSearch, setCompletedSearch] = useState("");
  const [emirateFilter, setEmirateFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState<string>("All");

  useEffect(() => {
    if (hasRegionalRestriction && userAllowedEmirates.length > 0) {
      if (emirateFilter !== "All" && !userAllowedEmirates.some((e) => e.toLowerCase() === emirateFilter.toLowerCase())) {
        setEmirateFilter("All");
      }
    }
  }, [loggedInUser, emirateFilter, hasRegionalRestriction, userAllowedEmirates]);

  const [activeReportDetails, setActiveReportDetails] = useState<ReportItem | null>(null);
  const [activeSystemTab, setActiveSystemTab] = useState<"service" | "engineering">("service");
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [simulatedPrint, setSimulatedPrint] = useState(false);

  useEffect(() => {
    setSelectedReportIds([]);
  }, [activeSystemTab]);

  const [engineeringReports, setEngineeringReports] = useState<any[]>(() => {
    const saved = localStorage.getItem("ALW_ENGINEERING_REPORTS");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    const unsubscribe = subscribeCollection<any>("engineeringReports", (list) => {
      if (list) {
        setEngineeringReports(list);
        localStorage.setItem("ALW_ENGINEERING_REPORTS", JSON.stringify(list));
      }
    });
    return () => unsubscribe();
  }, []);

  // Map engineering reports into the ReportItem schema shape for the table UI
  const mappedEngineeringReports: ReportItem[] = engineeringReports.map(er => ({
    id: er.id,
    ticketNo: er.reportNo,
    facilityName: er.clientName,
    emirate: er.emirate || "Dubai",
    facilityType: "Completed",
    dateOfOperation: er.date || er.createdAt?.split("T")[0] || "",
    startTime: "N/A",
    endTime: "N/A",
    billing: { amount: "No", method: "" },
    rawEngineeringData: er,
  }));

  const filteredMappedEngineeringReports = hasRegionalRestriction
    ? mappedEngineeringReports.filter((r) =>
        userAllowedEmirates.some((e) => e.toLowerCase() === (r.emirate || "").toLowerCase())
      )
    : mappedEngineeringReports;

  const combinedReports = [...reports, ...filteredMappedEngineeringReports];

  // Filter items (shows all reports including complete, but we enforce search strings)
  const filteredCompletedReports = combinedReports.filter(r => {
    // Determine the type match based on the active tab
    const isEngineeringType = !!r.rawEngineeringData;
    const matchesTabType = activeSystemTab === "engineering" ? isEngineeringType : !isEngineeringType;

    // Filter by month
    let matchesMonth = true;
    if (monthFilter !== "All") {
      const { month } = getReportMonthAndYear(r.dateOfOperation);
      matchesMonth = String(month) === monthFilter;
    }

    const matchesSearch = r.facilityName?.toLowerCase().includes(completedSearch.toLowerCase()) || 
                          r.ticketNo?.toLowerCase().includes(completedSearch.toLowerCase()) ||
                          r.id?.toLowerCase().includes(completedSearch.toLowerCase());
    const rEmirateClean = (r.emirate || "").trim().toLowerCase();
    const fEmirateClean = (emirateFilter || "").trim().toLowerCase();
    const matchesEmirate = emirateFilter === "All" || rEmirateClean === fEmirateClean;
    return matchesTabType && matchesMonth && matchesSearch && matchesEmirate;
  }).sort((a, b) => {
    const dateA = a.dateOfOperation || "";
    const dateB = b.dateOfOperation || "";
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA); // Descending: newer date first, older at bottom
    }

    const parseTimeToMinutes = (report: typeof a): number => {
      const timeStr = report.startTime;
      if (timeStr && timeStr !== "N/A") {
        const cleanStr = timeStr.trim().toUpperCase();
        const match = cleanStr.match(/^(\d+):(\d+)\s*(AM|PM)?/);
        if (match) {
          let hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const ampm = match[3];
          
          if (ampm === "PM" && hours < 12) {
            hours += 12;
          } else if (ampm === "AM" && hours === 12) {
            hours = 0;
          }
          
          return hours * 60 + minutes;
        }
      }
      
      if (report.rawEngineeringData?.createdAt) {
        try {
          const dateObj = new Date(report.rawEngineeringData.createdAt);
          if (!isNaN(dateObj.getTime())) {
            return dateObj.getHours() * 60 + dateObj.getMinutes();
          }
        } catch (e) {}
      }
      
      return 0;
    };

    const timeA = parseTimeToMinutes(a);
    const timeB = parseTimeToMinutes(b);
    if (timeA !== timeB) {
      return timeB - timeA; // Descending: later time first, earlier time at bottom
    }

    const numA = parseInt(String(a.ticketNo || a.id || "").replace(/\D/g, ""), 10);
    const numB = parseInt(String(b.ticketNo || b.id || "").replace(/\D/g, ""), 10);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numB - numA; // Descending: higher number first
    }

    const ticketA = String(a.ticketNo || a.id || "");
    const ticketB = String(b.ticketNo || b.id || "");
    return ticketB.localeCompare(ticketA); // Descending
  });

  const downloadFullReportPDF = async (report: ReportItem) => {
    try {
      let contentHtml = "";
      if (report.rawEngineeringData) {
        contentHtml = generateEngineeringHTML(report.rawEngineeringData, language);
      } else {
        contentHtml = generateReportHTML(report, language);
      }

      let facilityNameStr = "Report";
      const fName = report.facilityName;
      if (fName) {
        if (typeof fName === "object") {
          facilityNameStr = (fName as any).name || (fName as any).facilityName || (fName as any).label || "Report";
        } else {
          facilityNameStr = String(fName);
        }
      }
      const cleanFacilityName = facilityNameStr
        .replace(/[\/\\:*?"<>|]/g, "_")
        .trim();
      const cleanDate = (report.dateOfOperation || "NoDate")
        .replace(/[\/\\:*?"<>|]/g, "-")
        .trim();
      const filename = `${cleanFacilityName} - ${cleanDate}`;

      await printHTMLContent(contentHtml, filename);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerPrintDoc = () => {
    if (!activeReportDetails) return;

    setSimulatedPrint(true);
    document.body.classList.add("pdf-download-active");

    const originalTitle = document.title;
    let facilityNameStr = "Report";
    const fName = activeReportDetails.facilityName;
    if (fName) {
      if (typeof fName === "object") {
        facilityNameStr = (fName as any).name || (fName as any).facilityName || (fName as any).label || "Report";
      } else {
        facilityNameStr = String(fName);
      }
    }
    const cleanFacilityName = facilityNameStr.replace(/[\/\\:*?"<>|]/g, "_").trim();
    const cleanDate = (activeReportDetails.dateOfOperation || "NoDate").replace(/[\/\\:*?"<>|]/g, "-").trim();
    const filename = `${cleanFacilityName} - ${cleanDate}`;
    document.title = filename;

    setTimeout(() => {
      window.focus();
      window.print();

      setTimeout(() => {
        document.body.classList.remove("pdf-download-active");
        document.title = originalTitle;
        setSimulatedPrint(false);
      }, 500);
    }, 500);
  };

  const handleBulkDownload = async () => {
    if (selectedReportIds.length === 0) return;

    const selectedReports = selectedReportIds
      .map((id) => filteredCompletedReports.find((r) => r.id === id))
      .filter((r): r is ReportItem => !!r);

    if (selectedReports.length === 0) return;

    try {
      const combinedHtml = generateBulkReportsHTML(selectedReports, language);
      const bulkFileName = language === "bn"
        ? `সম্মিলিত-রিপোর্ট-${selectedReports.length}`
        : `Combined-Reports-${selectedReports.length}`;
      await printHTMLContent(combinedHtml, bulkFileName);
    } catch (e) {
      console.error("Bulk printing failed", e);
      alert("Failed to create bulk PDF view.");
    }

    setSelectedReportIds([]);
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto font-sans p-6 md:p-8">
      <div className={`border rounded-2xl shadow-lg relative animate-fadeIn transition-all ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="animate-fadeIn">
          <div className={`p-5 md:p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDark ? "bg-slate-800/80 border-slate-700" : "bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200"} rounded-t-2xl`}>
            <div>
              <h2 className={`text-base font-black flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>
                  {activeSystemTab === "engineering" 
                    ? (language === "bn" ? "ইঞ্জিনিয়ারিং রিপোর্ট (কমপ্লিট)" : "Engineering Reports (Completed)")
                    : (language === "bn" ? "সম্পূর্ণ কাজ শেষ হয়ে গেছে কমপ্লিট" : "Operations Ledger (Completed Services)")}
                </span>
              </h2>
              <p className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {activeSystemTab === "engineering"
                  ? (language === "bn" ? "সিস্টেম ডাটাবেসে সফলভাবে সাবমিট হওয়া ইঞ্জিনিয়ারিং রিপোর্ট।" : "Live list of processed engineering reports saved securely inside the central logbook.")
                  : (language === "bn" ? "সিস্টেম ডাটাবেসে সফলভাবে সাবমিট ও রেজিস্টার হওয়া চিকিৎসার রেকর্ড।" : "Live list of processed operations saved securely inside central medical logbook.")}
              </p>
            </div>

            {/* TAB BUTTONS */}
            <div className={`flex p-1 rounded-xl w-fit shrink-0 ${isDark ? "bg-slate-900 border border-slate-700" : "bg-slate-200/50"}`}>
              <button
                onClick={() => setActiveSystemTab("service")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeSystemTab === "service"
                    ? (isDark ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-800 shadow-sm")
                    : (isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")
                }`}
              >
                {language === "bn" ? "সার্ভিস রিপোর্ট" : "Service Report"}
              </button>
              <button
                onClick={() => setActiveSystemTab("engineering")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeSystemTab === "engineering"
                    ? (isDark ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-800 shadow-sm")
                    : (isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700")
                }`}
              >
                {language === "bn" ? "ইঞ্জিনিয়ারিং রিপোর্ট" : "Engineering Report"}
              </button>
            </div>
            
            <div className="flex flex-wrap flex-1 justify-end items-center gap-2 w-full md:w-auto">
              {/* Month Filter Dropdown */}
              <div className="relative text-xs">
                <span className={`absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className={`border text-[11px] font-bold pl-8 pr-2 py-1.5 rounded-lg outline-none cursor-pointer focus:border-indigo-500 ${isDark ? "bg-slate-900 border-slate-600 text-slate-200" : "bg-white border-slate-350 text-slate-800"}`}
                >
                  {(monthsList[language] || monthsList.en).map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={emirateFilter}
                onChange={(e) => setEmirateFilter(e.target.value)}
                className={`border text-[11px] font-bold px-2 py-1.5 rounded-lg outline-none cursor-pointer focus:border-indigo-500 ${isDark ? "bg-slate-900 border-slate-600 text-slate-200" : "bg-white border-slate-350 text-slate-800"}`}
              >
                <option value="All">{language === "bn" ? "সব এমিরেট" : "All Emirates"}</option>
                {(() => {
                  const allEm = ["Ajman", "Dubai", "Sharjah", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah", "Abu Dhabi"];
                  return hasRegionalRestriction
                    ? allEm.filter((em) => userAllowedEmirates.some((e) => e.toLowerCase() === em.toLowerCase()))
                    : allEm;
                })().map((em) => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </select>

              <div className="relative w-full sm:w-48 text-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={completedSearch}
                  onChange={(e) => setCompletedSearch(e.target.value)}
                  placeholder={language === "bn" ? "সেন্টার বা টিকিট নম্বর..." : "Search completed clinics..."}
                  className={`w-full text-[11px] pl-8 pr-2 py-1.5 border rounded-lg outline-none focus:border-indigo-500 ${isDark ? "bg-slate-900 border-slate-600 text-slate-200 placeholder-slate-500" : "bg-white border-slate-350 text-slate-800 placeholder-slate-400"}`}
                />
              </div>
            </div>
          </div>

          <div className={`overflow-x-auto ${isDark ? "bg-slate-800" : "bg-white"} ${selectedReportIds.length > 0 ? "" : "rounded-b-2xl"} min-h-[500px]`}>
            {filteredCompletedReports.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <span className="text-3xl block">📁</span>
                <p className="text-[11px] font-bold">
                  {language === "bn" ? "কোন মেলানো সম্পন্ন রিপোর্ট পাওয়া যায়নি" : "No completed records matching filters found."}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`uppercase font-mono tracking-wider text-[9px] select-none border-b ${isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                    <th className="py-3 px-4 font-black">{language === "bn" ? "লগ আইডি" : "LOG ID"}</th>
                    <th className="py-3 px-4 font-black">
                      {activeSystemTab === "engineering" 
                        ? (language === "bn" ? "ক্লায়েন্ট / প্রজেক্ট" : "CLIENT / FACILITY") 
                        : (language === "bn" ? "সেন্টার / হসপিটাল" : "MEDICAL FACILITY")}
                    </th>
                    <th className="py-3 px-4 font-black">{language === "bn" ? "তারিখ ও সময়" : "DATE & TIME"}</th>
                    <th className="py-3 px-4 font-black">{language === "bn" ? "পেমেন্ট অবস্থা" : "BILLING CASH STATUS"}</th>
                    <th className="py-3 px-4 font-black text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span>{language === "bn" ? "অ্যাকশন" : "ACTIONS"}</span>
                        <input
                          type="checkbox"
                          checked={filteredCompletedReports.length > 0 && filteredCompletedReports.every(r => selectedReportIds.includes(r.id))}
                          ref={(input) => {
                            if (input) {
                              const some = filteredCompletedReports.some(r => selectedReportIds.includes(r.id));
                              const all = filteredCompletedReports.every(r => selectedReportIds.includes(r.id));
                              input.indeterminate = some && !all;
                            }
                          }}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newIds = filteredCompletedReports.map(r => r.id);
                              setSelectedReportIds(prev => Array.from(new Set([...prev, ...newIds])));
                            } else {
                              const idsToRemove = filteredCompletedReports.map(r => r.id);
                              setSelectedReportIds(prev => prev.filter(id => !idsToRemove.includes(id)));
                            }
                          }}
                          title={language === "bn" ? "সব সিলেক্ট করুন" : "Select All"}
                          className="w-3.5 h-3.5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer ml-1"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${isDark ? "divide-slate-700/50" : "divide-slate-100"}`}>
                  {filteredCompletedReports.map((report, idx) => {
                    const isFree = !report.billing?.amount || 
                                   report.billing?.amount === 0 || 
                                   String(report.billing?.amount).toLowerCase().trim() === "no charge" ||
                                   String(report.billing?.amount).trim() === "" ||
                                   String(report.billing?.amount).trim() === "No";

                    return (
                      <tr key={`${report.id}-${idx}`} className={`group transition-colors ${isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50/50"}`}>
                         <td className="py-3 px-4">
                           <span className={`block font-mono text-[10.5px] font-bold ${isDark ? "text-slate-400" : "text-slate-550"}`}>{report.id}</span>
                           {(() => {
                             const getCreatorDisplayName = (rep: typeof report) => {
                               if (rep.createdBy && rep.createdBy.username) {
                                 const rawUser = rep.createdBy.username;
                                 if (rawUser === "hussainahmad13122@gmail.com" || rawUser === "admin") {
                                   return "Admin";
                                 }
                                 let clean = rawUser.split("@")[0];
                                 clean = clean.replace(/[\._-]/g, " ");
                                 return clean
                                   .split(/\s+/)
                                   .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                   .join(" ");
                               }
                               return "Admin";
                             };

                             const creatorName = getCreatorDisplayName(report);
                             const initials = creatorName
                               .split(/\s+/)
                               .map((word) => word[0])
                               .join("")
                               .substring(0, 2)
                               .toUpperCase() || "A";
                             
                             const getAvatarBg = (name: string) => {
                               let hash = 0;
                               for (let i = 0; i < name.length; i++) {
                                 hash = name.charCodeAt(i) + ((hash << 5) - hash);
                               }
                               const bgColors = [
                                 "bg-rose-500",
                                 "bg-amber-500",
                                 "bg-emerald-500",
                                 "bg-indigo-500",
                                 "bg-cyan-500",
                                 "bg-teal-500",
                                 "bg-violet-500",
                                 "bg-sky-500",
                                 "bg-purple-500"
                               ];
                               const idxColor = Math.abs(hash) % bgColors.length;
                               return bgColors[idxColor];
                             };

                             return (
                               <div className="flex items-center gap-1.5 mt-1">
                                 {(() => {
                                   const usersStr = localStorage.getItem("ALW_STAR_USERS") || localStorage.getItem("ALW_STANDALONE_DB_users");
                                   let creatorProfilePic = "";
                                   if (usersStr) {
                                     try {
                                       const usersList = JSON.parse(usersStr);
                                       const matchedUser = usersList.find((u: any) => 
                                         u.username && report.createdBy?.username && u.username.toLowerCase() === report.createdBy.username.toLowerCase()
                                       );
                                       if (matchedUser && matchedUser.profilePic) {
                                         creatorProfilePic = matchedUser.profilePic;
                                       }
                                     } catch (e) {}
                                   }
                                   if (creatorProfilePic) {
                                     return (
                                       <img
                                         src={creatorProfilePic}
                                         alt={creatorName}
                                         className="w-5 h-5 rounded-full object-cover shrink-0 shadow-xs border border-slate-700/50"
                                         referrerPolicy="no-referrer"
                                       />
                                     );
                                   }
                                   return (
                                     <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white ${getAvatarBg(creatorName)} shrink-0 shadow-xs uppercase select-none`}>
                                       {initials}
                                     </div>
                                   );
                                 })()}
                                 <span className={`text-[10px] font-bold max-w-[120px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`} title={creatorName}>
                                   {creatorName}
                                 </span>
                               </div>
                             );
                           })()}
                         </td>
                        <td className={`py-3 px-4 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                          <span className="font-extrabold text-[12px] block">{report.facilityName}</span>
                          <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-400"}`}>{report.emirate} • {formatFacilityType(report.facilityType, language)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`block font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{report.dateOfOperation}</span>
                          <span className={`text-[10px] block font-mono ${isDark ? "text-slate-400" : "text-slate-400"}`}>{report.startTime} - {report.endTime}</span>
                        </td>
                        
                        <td className="py-3 px-4">
                          {isFree ? (
                            <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold uppercase border ${isDark ? "bg-slate-800 text-slate-400 border-slate-600" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                              {language === "bn" ? "বিনামূল্যে সার্ভিস" : "Complimentary Service"}
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className={`font-extrabold text-[11px] px-2 py-0.5 rounded border inline-block font-mono ${isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                                {report.billing?.amount} AED
                              </span>
                              <span className={`text-[9px] block font-bold uppercase pl-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                • Paid ({report.billing?.method || "Cash"})
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {onEditReport && !report.rawEngineeringData && (
                              <button
                                onClick={() => onEditReport(report)}
                                className={`p-1.5 rounded-lg active:scale-95 transition-all text-[11px] border cursor-pointer ${isDark ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20" : "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-100"}`}
                                title={language === "bn" ? "এডিট" : "Edit"}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setActiveReportDetails(report)}
                              className={`px-3 py-1.5 font-black rounded-lg text-[10.5px] inline-flex items-center gap-1 cursor-pointer transition active:scale-95 border ${isDark ? "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 text-indigo-400 hover:text-indigo-300" : "bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-700 hover:text-indigo-800"}`}
                            >
                              👁️ <span>{language === "bn" ? "দেখুন ও প্রিন্ট" : "View & PDF"}</span>
                            </button>
                            {onDeleteReport && !report.rawEngineeringData && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if(window.confirm(language === "bn" ? "আপনি কি নিশ্চিত যে এই রিপোর্টটি মুছতে চান?" : "Are you sure you want to delete this report?")) {
                                    onDeleteReport(report.id);
                                  }
                                }}
                                className={`p-1.5 rounded-lg active:scale-95 transition-all text-[11px] border cursor-pointer ${isDark ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20" : "bg-red-50 hover:bg-red-100 text-red-600 border-red-100"}`}
                                title={language === "bn" ? "ডিলিট" : "Delete"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            <input
                              type="checkbox"
                              checked={selectedReportIds.includes(report.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedReportIds(prev => [...prev, report.id]);
                                } else {
                                  setSelectedReportIds(prev => prev.filter(id => id !== report.id));
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer ml-1 shrink-0"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {selectedReportIds.length > 0 && (
            <div className={`p-4 border-t flex items-center justify-between text-xs font-bold ${isDark ? "bg-slate-900/90 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"} rounded-b-2xl`}>
              <div>
                {language === "bn" 
                  ? `মোট ${selectedReportIds.length} টি রিপোর্ট নির্বাচিত` 
                  : `${selectedReportIds.length} report(s) selected`}
              </div>
              <button
                onClick={handleBulkDownload}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-md"
              >
                📥 <span>{language === "bn" ? "ডাউনলোড করুন" : "Download Selected"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {activeReportDetails && (
        activeReportDetails.rawEngineeringData ? (
          <div id="erp-view-details-engineering" className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950">
            <EngineeringReport
              language={language}
              companyBrand="AL WAFA STAR"
              profileUser="Admin"
              previewTargetReport={activeReportDetails.rawEngineeringData}
              onClosePreview={() => setActiveReportDetails(null)}
            />
          </div>
        ) : (
          <div id="erp-completed-details-overlay" className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs transition-all animate-fadeIn font-sans">
            <div className="bg-[#FFFDF3] border-2 border-slate-900 max-w-4xl w-full h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl relative text-slate-900 font-sans border-t-8 border-t-indigo-650 animate-scale-up">
              
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-rose-550 text-xs">●</span>
                  <span className="text-xs font-black tracking-widest font-mono text-slate-300">
                    {language === "bn" ? "অপারেশন প্রুফ ভিউয়ার" : "AL WAFA STAR PDF COMPLIANCE GATEWAY"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerPrintDoc}
                    disabled={simulatedPrint}
                    className="px-4 py-2 bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition duration-150 shadow border border-emerald-500/30"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>
                      {simulatedPrint ? (language === "bn" ? "প্রিন্ট হচ্ছে..." : "Printing...") : (language === "bn" ? "ব্রাউজার প্রিন্ট / PDF" : "Browser Print")}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveReportDetails(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition duration-150 shadow border border-slate-700"
                  >
                    <X className="w-4 h-4 cursor-pointer" />
                    <span>{language === "bn" ? "ফিরে যান" : "Close"}</span>
                  </button>
                </div>
              </div>

              <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-200 text-indigo-900 text-[11px] font-bold flex items-center gap-2 no-print shrink-0">
                <span className="animate-pulse">💡</span>
                <p className="leading-normal">
                  {language === "bn"
                    ? "ইন্টারনেট ব্রাউজার থেকে সরাসরি PDF ডাউনলোড করতে উপরের প্রিন্ট বাটনে চাপ দিন। কোনো কারণে পপআপ বা উইন্ডো না খুললে, স্ক্রীনের উপরে ডানে থাকা 'Open in New Tab' বাটনে ক্লিক করে অ্যাপটি খুলুন।"
                    : "To download as PDF, click print and choose 'Save as PDF'. If the print layout is blocked, please click the native 'Open in New Tab' portal launcher on the top right."}
                </p>
              </div>

              {/* Main scroll viewport of physical document */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                
                {/* Printable sheet mirroring physical format precisely */}
                <div id="printable-service-report" className="print-sheet-paper space-y-6 text-slate-950 font-sans">
                  
                  {/* Red star watermark in the absolute background */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none z-0">
                    <svg viewBox="0 0 100 100" className="w-[140mm] h-[140mm] object-contain">
                      <polygon points="50,5 64,36 98,36 71,57 81,91 50,70 19,91 29,57 2,36 36,36" fill="#ED1C24" />
                    </svg>
                  </div>

                  {/* ================= PAPER HEADER BLOCK ================= */}
                  <div className="border border-slate-800 p-3 mb-3 bg-white relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-3 pb-2 border-b border-slate-300 text-center md:text-left">
                      
                      {/* Left Header info */}
                      <div className="space-y-1.5 w-full md:w-auto text-left">
                        <div className="flex items-center gap-1 font-semibold text-xs">
                          <span className="text-slate-500 font-mono">SL. No</span>
                          <input
                            type="text"
                            readOnly
                            value={activeReportDetails.id.split('-')[1] || "0229"}
                            className="w-16 px-1.5 py-0.5 bg-yellow-50/50 border border-red-300 text-red-600 font-bold font-mono text-center rounded outline-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1 text-[10.5px]">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 w-12 font-medium">Date:</span>
                            <input
                              type="text"
                              readOnly
                              value={activeReportDetails.dateOfOperation}
                              className="px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold bg-white text-slate-900 w-28 text-center"
                            />
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-slate-500 w-12 font-medium">Contract:</span>
                            <input
                              type="text"
                              readOnly
                              value={activeReportDetails.contractNo || "Optional"}
                              className="px-1.5 py-0.5 border border-slate-300 rounded font-medium bg-white text-slate-900 w-28 text-center"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Central Star & Trademark block */}
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2.5 py-0.5">
                          <span className="text-3xl text-[#ED1C24] block leading-none shrink-0" style={{ filter: "drop-shadow(0 0 2px rgba(237,28,36,0.3))" }}>★</span>
                          <div className="text-left font-serif">
                            <span className="block text-[13px] font-extrabold tracking-wide text-slate-950 leading-tight">نجمة الوفاء</span>
                            <div className="flex items-center gap-1.5 leading-none mt-0.5">
                              <span className="text-[12px] font-black tracking-tight text-[#ED1C24] font-mono">AL WAFA STAR</span>
                              <span className="text-[10px] font-extrabold text-[#ED1C24] font-sans">Pest Control Services</span>
                            </div>
                            <div className="mt-1">
                              <span className="inline-block py-0.5 px-3 bg-slate-900 text-yellow-400 font-extrabold font-mono text-[8.5px] uppercase tracking-wider rounded-full border border-slate-700 leading-none">
                                Pest Control Division
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right spacer */}
                      <div className="hidden md:block w-32"></div>

                    </div>

                    {/* TREATMENT REPORT title line */}
                    <div className="bg-slate-900 text-white text-center font-serif font-black tracking-wider text-[12px] py-1 mt-1">
                      TREATMENT REPORT
                    </div>
                  </div>

                  {/* CLIENT & DETAILS SECTION */}
                  <div className="border border-slate-800 bg-white grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-[10.5px] relative z-10">
                    {/* Left Column */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start gap-1">
                        <span className="font-extrabold text-slate-500 uppercase min-w-[120px] block shrink-0">CLIENT NAME:</span>
                        <span className="font-black text-slate-900 uppercase">{activeReportDetails.facilityName}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="font-extrabold text-slate-500 uppercase min-w-[120px] block shrink-0">CONTACT NO. (OPT):</span>
                        <span className="font-bold text-slate-800">{activeReportDetails.mobile || "Optional"}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="font-extrabold text-slate-500 uppercase min-w-[120px] block shrink-0">TIME START:</span>
                        <span className="font-bold text-slate-800 uppercase">{activeReportDetails.startTime}</span>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start gap-1">
                        <span className="font-extrabold text-slate-500 uppercase min-w-[100px] block shrink-0">ADDRESS:</span>
                        <span className="font-bold text-slate-900 uppercase">{activeReportDetails.address || activeReportDetails.emirate}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="font-extrabold text-slate-500 uppercase min-w-[100px] block shrink-0">EMAIL (OPT):</span>
                        <span className="font-bold text-slate-800 select-all">{activeReportDetails.email || "Optional"}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="font-extrabold text-slate-500 uppercase min-w-[100px] block shrink-0">TIME END:</span>
                        <span className="font-bold text-slate-900 uppercase">{activeReportDetails.endTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* SERVICE CHECKLISTS & TREATMENT SCOPE */}
                  <div className="border border-slate-800 bg-white grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-[10.5px] relative z-10">
                    
                    {/* Service Checklists */}
                    <div className="p-3">
                      <span className="block font-black uppercase tracking-wider text-slate-900 mb-2 border-b border-dashed border-slate-300 pb-1">
                        SERVICE CHECKLISTS:
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {["Basic", "Follow Up", "Call Back", "One Time", "Replenishing", "Free", "Sample"].map((item) => {
                          const isChecked = activeReportDetails.categories?.some(c => c && typeof c === "string" && c.toLowerCase() === item.toLowerCase()) || 
                                            activeReportDetails.methods?.some(m => m && typeof m === "string" && m.toLowerCase() === item.toLowerCase());
                          return (
                            <div key={item} className="flex items-center gap-1.5 font-bold">
                              <div className={`w-4 h-4 border flex items-center justify-center rounded-sm transition ${
                                isChecked ? "border-slate-800 bg-emerald-50 text-emerald-900 font-black" : "border-slate-300 bg-white"
                              }`}>
                                {isChecked ? <span className="text-[10px] leading-none">✔</span> : null}
                              </div>
                              <span className="text-[10px] text-slate-800 whitespace-nowrap">{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Treatment Scope (Abbr) */}
                    <div className="p-3">
                      <span className="block font-black uppercase tracking-wider text-slate-905 mb-2 border-b border-dashed border-slate-300 pb-1">
                        TREATMENT SCOPE (ABBR):
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {["GPC", "FICP", "RCP", "TCP", "BCP", "SCP"].map((item) => {
                          const isChecked = activeReportDetails.categories?.some(c => {
                            if (!c || typeof c !== "string") return false;
                            const lc = c.toLowerCase();
                            return lc === item.toLowerCase() || lc === `${item.toLowerCase()} treatment` || lc.startsWith(item.toLowerCase() + " ");
                          });
                          return (
                            <div key={item} className="flex items-center gap-1.5 font-bold">
                              <div className={`w-4 h-4 border flex items-center justify-center rounded-sm transition ${
                                isChecked ? "border-slate-800 bg-indigo-50 text-indigo-900 font-black" : "border-slate-300 bg-white"
                              }`}>
                                {isChecked ? <span className="text-[10px] leading-none">✔</span> : null}
                              </div>
                              <span className="text-[10px] text-slate-800 whitespace-nowrap">{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* COVERED AREA DETAILS & FINDINGS */}
                  <div className="border border-slate-800 bg-white p-3 text-[10.5px] relative z-10">
                    <span className="block font-black uppercase tracking-wider text-slate-900 mb-1.5 border-b border-dashed border-slate-300 pb-1">
                      COVERED AREA DETAILS & FINDINGS:
                    </span>
                    {activeReportDetails.areas && activeReportDetails.areas.length > 0 ? (
                      <div className="mt-1.5 p-3.5 bg-[#FFFDF9] border border-slate-300 rounded font-mono text-[11px] font-bold text-slate-850 whitespace-pre-wrap break-words leading-relaxed">
                        {activeReportDetails.areas.join("\n")}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[10px] py-1">
                        {language === "bn" ? "কোন কাভারেজ এরিয়া বিবরণী যুক্ত করা নাই।" : "No covered area details logged."}
                      </div>
                    )}
                  </div>
   
                  {/* ================= METHOD OF APPLICATION, TREATMENT & EFFICACY SUB-REPORT SECTION ================= */}
                  <div className="border border-slate-800 bg-white grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-[10.5px] relative z-10">
                    {/* Method of Application Column */}
                    <div className="p-3">
                      <span className="block font-black uppercase tracking-wider text-slate-900 mb-1.5 border-b border-dashed border-slate-300 pb-1 text-left">
                        {language === "bn" ? "প্রয়োগ পদ্ধতি (Method of Application):" : "METHOD OF APPLICATION:"}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 font-bold">
                        {["Spraying", "Trapping", "Dusting", "Baiting", "Repellents", "IGR's", "ULV", "Fogging"].map((item) => {
                          const isChecked = activeReportDetails.methods?.some(m => m && typeof m === "string" && m.toLowerCase() === item.toLowerCase());
                          return (
                            <div key={item} className="flex items-center gap-1.5 font-bold text-[9.5px]">
                              <div className={`w-3.5 h-3.5 border flex items-center justify-center rounded-sm transition shrink-0 ${
                                isChecked ? "border-slate-800 bg-emerald-50 text-emerald-900 font-extrabold" : "border-slate-300 bg-white"
                              }`}>
                                {isChecked ? <span className="text-[9px] leading-none">✔</span> : null}
                              </div>
                              <span className="text-[10px] text-slate-800 whitespace-nowrap">{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Method of Treatment Column */}
                    <div className="p-3">
                      <span className="block font-black uppercase tracking-wider text-slate-900 mb-1.5 border-b border-dashed border-slate-300 pb-1 text-left">
                        {language === "bn" ? "ট্রিটমেন্ট পদ্ধতি (Method of Treatment):" : "METHOD OF TREATMENT:"}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 font-bold">
                        {["Space Treatment", "Spot Treatment", "Cracks/Crevices", "Band Treatment"].map((item) => {
                          const isChecked = activeReportDetails.methods?.some(m => m && typeof m === "string" && m.toLowerCase() === item.toLowerCase());
                          return (
                            <div key={item} className="flex items-center gap-1.5 font-bold text-[9.5px]">
                              <div className={`w-3.5 h-3.5 border flex items-center justify-center rounded-sm transition shrink-0 ${
                                isChecked ? "border-slate-800 bg-indigo-50 text-indigo-900 font-extrabold" : "border-slate-300 bg-white"
                              }`}>
                                {isChecked ? <span className="text-[9px] leading-none">✔</span> : null}
                              </div>
                              <span className="text-[10px] text-slate-800 whitespace-nowrap">{item}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Effectiveness / Efficacy Column */}
                    <div className="p-3 flex flex-col justify-between">
                      <div>
                        <span className="block font-black uppercase tracking-wider text-slate-900 mb-1.5 border-b border-dashed border-slate-300 pb-1 text-left">
                          {language === "bn" ? "কার্যকারিতা (Effectiveness / Efficacy):" : "EFFECTIVENESS / EFFICACY:"}
                        </span>
                        <div className="grid grid-cols-1 gap-1.5 font-bold">
                          {["Residual Treatment", "Knockdown Treatment"].map((item) => {
                            const isChecked = activeReportDetails.methods?.some(m => m && typeof m === "string" && m.toLowerCase() === item.toLowerCase());
                            return (
                              <div key={item} className="flex items-center gap-1.5 font-bold text-[9.5px]">
                                <div className={`w-3.5 h-3.5 border flex items-center justify-center rounded-sm transition shrink-0 ${
                                  isChecked ? "border-slate-800 bg-rose-50 text-rose-900 font-extrabold" : "border-slate-300 bg-white"
                                }`}>
                                  {isChecked ? <span className="text-[9px] leading-none">✔</span> : null}
                                </div>
                                <span className="text-[10px] text-slate-800 whitespace-nowrap">{item}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[8.5px] text-slate-500 bg-slate-50 p-1 rounded border border-slate-200">
                        <span>🎫 {language === "bn" ? "যাচাইকৃত নিরাপদ ফর্মূলা মানসমূহ" : "Verified safe formula values"}</span>
                      </div>
                    </div>
                  </div>

                  {/* ================= SECTION 4: INFESTATION MONITORING TABLE ================= */}
                  <div className="border border-slate-800 bg-white p-3 space-y-2 relative z-10">
                    <span className="block font-black uppercase tracking-wider text-slate-900 border-b border-dashed border-slate-300 pb-1 text-[10.5px]">
                      4. INFESTATION MONITORING TABLE / DETAILED INCIDENCE MATRIX:
                    </span>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-900 text-white uppercase text-[8px] tracking-wider font-extrabold">
                            <th className="p-2 border border-slate-800 w-[180px]">PEST TYPE / SPECIES</th>
                            <th className="p-2 border border-slate-800 w-[60px] text-center">NONE</th>
                            <th className="p-2 border border-slate-800 w-[60px] text-center">LOW</th>
                            <th className="p-2 border border-slate-800 w-[60px] text-center">MEDIUM</th>
                            <th className="p-2 border border-slate-800 w-[60px] text-center">HIGH</th>
                            <th className="p-2 border border-slate-800">FINDINGS LOCATION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeReportDetails.infestation && Object.keys(activeReportDetails.infestation).length > 0 ? (
                            Object.entries(activeReportDetails.infestation).map(([key, level], idx) => {
                              const match = key.match(/^([^(]+)(?:\s*\(([^)]+)\))?/);
                              const pestName = match ? match[1].trim() : key;
                              const findingsLocation = (match && match[2]) ? match[2].trim() : "N/A";
                              const currentLevel = (String(level || "None")).trim();

                              return (
                                <tr key={idx} className="bg-white">
                                  <td className="p-2 border border-slate-200 font-sans font-extrabold text-slate-950 uppercase text-[10px]">
                                    {pestName}
                                  </td>
                                  {["None", "Low", "Medium", "High"].map((levelOpt) => {
                                    const isSelected = currentLevel.toLowerCase() === levelOpt.toLowerCase();
                                    return (
                                      <td key={levelOpt} className="p-2 border border-slate-200 text-center">
                                        <div className="flex justify-center items-center">
                                          <div className={`w-5 h-5 border flex items-center justify-center rounded transition ${
                                            isSelected 
                                              ? "border-slate-850 bg-indigo-50 text-indigo-900 font-black" 
                                              : "border-slate-300 bg-white"
                                          }`}>
                                            {isSelected ? (
                                              <span className="font-extrabold text-[12px] leading-none text-indigo-650">✔</span>
                                            ) : null}
                                          </div>
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td className="p-2 border border-slate-205 text-slate-800 font-bold uppercase font-sans text-[10px]">
                                    {findingsLocation}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr className="bg-white">
                              <td colSpan={6} className="p-3 text-center text-slate-400 font-sans italic">
                                {language === "bn" ? "কোন প্রকার উপদ্রব সনাক্ত করা যায়নি।" : "No pest infestation incidence parameters recorded."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ================= LINE-BY-LINE SECTOR 5: CHEMICAL DOSAGES & DILUTION DOSES REGISTERED ================= */}
                  <div className="bg-slate-50/50 border border-slate-800 rounded-xl p-4 space-y-3 relative z-10">
                    <div className="border-b border-dashed border-slate-300 pb-2">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono block">
                        {language === "bn" ? "৫. ব্যবহৃত কেমিক্যাল ও ডোজ জাবদা" : "5. CHEMICAL DOSAGES & DILUTION DOSES REGISTERED"}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-900 text-white uppercase text-[8px] tracking-wider font-black">
                            <th className="p-2 border border-slate-800">CHEMICAL NAME</th>
                            <th className="p-2 border border-slate-800">DILUTION RATE</th>
                            <th className="p-2 border border-slate-800">QTY SPEC</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono">
                          {activeReportDetails.chemicals && activeReportDetails.chemicals.length > 0 ? (
                            activeReportDetails.chemicals.map((chem, idx) => (
                               <tr key={idx} className="bg-white">
                                 <td className="p-2 border border-slate-200 font-sans font-extrabold text-slate-950 uppercase">{chem.name}</td>
                                 <td className="p-2 border border-slate-200 text-slate-700">{chem.dilution}</td>
                                 <td className="p-2 border border-slate-200 text-slate-900 font-extrabold">{chem.used}</td>
                               </tr>
                            ))
                          ) : (
                            <tr className="bg-white">
                              <td colSpan={3} className="p-3 text-center text-slate-400 font-sans italic">
                                {language === "bn" ? "কোন প্রকার কেমিক্যাল উপাদান ব্যবহার করার প্রয়োজন হয়নি।" : "No chemical material usage parameters recorded for this schedule service."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SANITARY RATINGS & CREW */}
                  <div className="border border-slate-800 bg-white divide-y divide-slate-800 text-[10.5px] relative z-10">
                    
                    {/* Sanitation block */}
                    <div className="p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap bg-[#FFFDF9]">
                      <div className="md:w-3/12 min-w-[130px] text-left">
                        <span className="text-[10.5px] font-extrabold text-slate-900 uppercase">
                          {language === "bn" ? "স্যানিটেশন কন্ডিশন:" : "Sanitation Condition:"}
                        </span>
                      </div>
                      <div className="md:w-4/12 flex items-center justify-start md:justify-center gap-4">
                        {(["Poor", "Satisfactory", "Good"] as const).map(lev => {
                          const isChecked = (activeReportDetails.sanitation || "Good") === lev;
                          return (
                            <div key={lev} className="flex items-center gap-1.5 font-bold select-none text-[10px]">
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center bg-white shrink-0">
                                {isChecked && (
                                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                                )}
                              </div>
                              <span className={isChecked ? "text-slate-900 font-extrabold" : "text-slate-500"}>
                                {lev === "Good" ? (language === "bn" ? "ভালো" : "Good") : lev === "Satisfactory" ? (language === "bn" ? "সন্তোষজনক" : "Satisfactory") : (language === "bn" ? "খারাপ" : "Poor")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="md:w-4.5/12 w-full md:flex-1 text-left">
                        <div className="w-full bg-[#FFFDF3] border border-slate-300 text-slate-900 font-bold rounded px-2.5 py-1 text-[10.5px] min-h-[22px] flex items-center font-mono">
                          {activeReportDetails.sanitationRemarks || (language === "bn" ? "কোন রিমার্কস বা মন্তব্য নেই।" : "No remarks.")}
                        </div>
                      </div>
                    </div>

                    {/* Proofing block */}
                    <div className="p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap bg-[#FFFDF9]">
                      <div className="md:w-3/12 min-w-[130px] text-left">
                        <span className="text-[10.5px] font-extrabold text-slate-900 uppercase">
                          {language === "bn" ? "প্রুফিং কন্ডিশন:" : "Proofing Condition:"}
                        </span>
                      </div>
                      <div className="md:w-4/12 flex items-center justify-start md:justify-center gap-4">
                        {(["Poor", "Satisfactory", "Good"] as const).map(lev => {
                          const isChecked = (activeReportDetails.proofing || "Good") === lev;
                          return (
                            <div key={lev} className="flex items-center gap-1.5 font-bold select-none text-[10px]">
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center bg-white shrink-0">
                                {isChecked && (
                                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                )}
                              </div>
                              <span className={isChecked ? "text-slate-900 font-extrabold" : "text-slate-500"}>
                                {lev === "Good" ? (language === "bn" ? "ভালো" : "Good") : lev === "Satisfactory" ? (language === "bn" ? "সন্তোষজনক" : "Satisfactory") : (language === "bn" ? "খারাপ" : "Poor")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="md:w-4.5/12 w-full md:flex-1 text-left">
                        <div className="w-full bg-[#FFFDF3] border border-slate-300 text-slate-900 font-bold rounded px-2.5 py-1 text-[10.5px] min-h-[22px] flex items-center font-mono">
                          {activeReportDetails.proofingRemarks || (language === "bn" ? "কোন রিমার্কস বা মন্তব্য নেই।" : "No remarks.")}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ================= LINE-BY-LINE SECTOR 6: ADVISORIES / RECOMMENDATIONS ================= */}
                  <div className="bg-slate-50/50 border border-slate-800 rounded-xl p-4 space-y-2 relative z-10">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono block">
                      {language === "bn" ? "৬. স্যানিটারি নির্দেশিকা ও প্রতিরোধক পরামর্শ" : "6. OPERATIONAL COMPLIANCE ADVISORIES / RECOMMENDATIONS"}
                    </span>
                    <div className="p-3 bg-white rounded-lg border border-slate-350 shadow-sm">
                      <ul className="space-y-1.5 text-[11px] text-slate-850 font-sans">
                        {activeReportDetails.recommendations && activeReportDetails.recommendations.length > 0 ? (
                          activeReportDetails.recommendations.map((r, i) => (
                            <li key={i} className="font-sans font-medium leading-relaxed">
                              {r}
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-400 italic font-sans font-medium leading-relaxed">
                            Keep environmental water inlets airtight and sanitization channels active.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* ================= LINE-BY-LINE SECTOR 7: BILLING INVOICE STRUCTURE ================= */}
                  {(() => {
                    const isFree = !activeReportDetails.billing?.amount || 
                                   activeReportDetails.billing?.amount === 0 || 
                                   String(activeReportDetails.billing?.amount).toLowerCase().trim() === "no charge" ||
                                   String(activeReportDetails.billing?.amount).trim() === "" ||
                                   String(activeReportDetails.billing?.amount).trim() === "No";

                    if (isFree) return null;

                    return (
                      <div className="bg-slate-50/50 border border-slate-800 rounded-xl p-4 space-y-3 relative z-10">
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest font-mono block">
                          💰 {language === "bn" ? "৭. বিলিং তথ্য" : "7. BILLING INVOICE REPORT SUMMARY"}
                        </span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white p-2 rounded-lg border border-slate-300">
                            <span className="text-slate-400 block text-[8px] font-bold uppercase">INVOICE SERIAL NO</span>
                            <span className="font-mono font-bold text-slate-850 block mt-0.5">{activeReportDetails.billing?.invoiceNo || `PC-${activeReportDetails.id}`}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-300">
                            <span className="text-slate-400 block text-[8px] font-bold uppercase">SUBTOTAL AMOUNT</span>
                            <span className="font-mono font-extrabold text-slate-850 block mt-0.5">{activeReportDetails.billing?.amount || 0} AED</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-300">
                            <span className="text-slate-400 block text-[8px] font-bold uppercase">TAX (5.0% GST)</span>
                            <span className="font-mono text-slate-500 font-bold block mt-0.5">{activeReportDetails.billing?.vat || 0} AED</span>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-300 p-2 rounded-lg">
                            <span className="text-emerald-700 block text-[8px] font-black uppercase">TOTAL SECURE CHARGE</span>
                            <span className="font-mono font-black text-emerald-800 text-sm block mt-0.5 select-all">{activeReportDetails.billing?.total || 0} AED</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ================= LINE-BY-LINE SECTOR 9: OFFICIAL VALIDATION SIGNATURE BLOCK ================= */}
                  <div className="pt-4 border-t border-slate-400 relative z-10">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono block mb-3 text-center">
                      {language === "bn" ? "৮. স্বাক্ষর ও সীল ভ্যালিডেশন সনদ" : "8. OFFICIAL STAMP & SEAL RECOGNITION"}
                    </span>
                    
                    <div className="grid grid-cols-2 gap-4 text-center text-[10px] select-none">
                      <div className="space-y-1">
                        <span className="text-slate-500 block uppercase text-[8px] font-bold">Client Seal / Signature</span>
                        <div className="h-20 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-1 bg-white shadow-inner">
                          {activeReportDetails.signatures?.client ? (
                            <img src={activeReportDetails.signatures.client} alt="Client signature" className="max-h-16 object-contain" />
                          ) : (
                            <span className="text-slate-300 text-[8px] font-mono">[ Clinician Representative ]</span>
                          )}
                        </div>
                        <span className="font-sans block font-extrabold text-slate-800 truncate">{activeReportDetails.contactPerson || "Attendant Guest"}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-500 block uppercase text-[8px] font-bold">Engineer & Technician Signature</span>
                        <div className="h-20 border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-1 bg-white shadow-inner">
                          {activeReportDetails.signatures?.technician || activeReportDetails.signatures?.supervisor ? (
                            <img src={activeReportDetails.signatures.technician || activeReportDetails.signatures.supervisor} alt="Engineer & Technician signature" className="max-h-16 object-contain" />
                          ) : (
                            <span className="bg-sky-50 text-sky-700 text-[8px] font-bold px-2 py-1 rounded border border-sky-100 select-none">CERTIFIED OPERATOR</span>
                          )}
                        </div>
                        <span className="font-sans block text-slate-800 font-semibold text-[9.5px]">AL WAFA Specialist</span>
                      </div>
                    </div>
                  </div>

                  {/* Letterhead Footer */}
                  <div className="border-t border-slate-300 pt-3 text-center text-[8.5px] text-slate-400 font-serif leading-relaxed font-bold relative z-10">
                    <p>Tel: 04-2959731, Fax: 04-2959732, P.O Box: 181244, Deira, Dubai - United Arab Emirates</p>
                    <p>E-mail: pestcontrol@alwafagroupuae.com, wafastaruae@yahoo.com | Website: www.alwafagroupuae.com</p>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
