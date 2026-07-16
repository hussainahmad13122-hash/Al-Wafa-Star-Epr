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
import { generateReportHTML, generateEngineeringHTML, printHTMLContent } from "./ClientDirectory";
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

  const handleBulkDownload = async () => {
    if (selectedReportIds.length === 0) return;

    const selectedReports = selectedReportIds
      .map((id) => filteredCompletedReports.find((r) => r.id === id))
      .filter((r): r is ReportItem => !!r);

    if (selectedReports.length === 0) return;

    if (selectedReports.length === 1) {
      await downloadFullReportPDF(selectedReports[0]);
      setSelectedReportIds([]);
      return;
    }

    try {
      const firstReport = selectedReports[0];
      const firstReportHTML = firstReport.rawEngineeringData 
        ? generateEngineeringHTML(firstReport.rawEngineeringData, language)
        : generateReportHTML(firstReport, language);

      const headSplit = firstReportHTML.split(/<body[^>]*>/i);
      const headPart = headSplit[0];

      const bodiesList: string[] = [];

      for (const r of selectedReports) {
        const html = r.rawEngineeringData 
          ? generateEngineeringHTML(r.rawEngineeringData, language)
          : generateReportHTML(r, language);

        const bodyContentMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyContentMatch && bodyContentMatch[1]) {
          bodiesList.push(bodyContentMatch[1]);
        } else {
          bodiesList.push(html);
        }
      }

      const combinedBody = bodiesList.join(
        '\n<div style="page-break-before: always; break-before: page; height: 1px; clear: both;"></div>\n'
      );

      const finalHTML = `${headPart}\n<body>\n${combinedBody}\n</body>\n</html>`;

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `AL_WAFA_STAR_Bulk_Reports_${dateStr}`;

      await printHTMLContent(finalHTML, filename);
    } catch (e) {
      console.error("Bulk printing failed", e);
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
                  const allEm = ["Ajman", "Dubai", "Sharjah", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah", "Abu Dhabi", "Al Dhaid"];
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs transition-all animate-fadeIn font-sans">
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
                    onClick={async () => {
                      const iframe = document.querySelector('iframe[title="Report Preview"]') as HTMLIFrameElement;
                      if (iframe && iframe.contentWindow) {
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
                        if (iframe.contentWindow.document) {
                          iframe.contentWindow.document.title = filename;
                        }
                        
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                        
                        setTimeout(() => {
                          document.title = originalTitle;
                        }, 1000);
                      } else {
                        await downloadFullReportPDF(activeReportDetails);
                      }
                    }}
                    className="px-4 py-2 bg-[#10B981] hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition duration-150 shadow border border-emerald-500/30"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>
                      {language === "bn" ? "ব্রাউজার প্রিন্ট / PDF" : "Browser Print"}
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

              <div className="flex-1 overflow-auto p-0 w-full relative" style={{ backgroundColor: "#323639" }}>
                <iframe 
                  srcDoc={generateReportHTML(activeReportDetails, language)} 
                  className="w-full h-full border-0 bg-[#323639]" 
                  title="Report Preview" 
                />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
