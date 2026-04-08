import React, { useState } from "react";
import { Download, Plus, Eye, EyeOff, Edit2, Trash2, Mail, Briefcase, Calendar } from "lucide-react";

const INITIAL_STAFF = [
  { id: 1, name: "Arjun Mehta", email: "arjun.m@mehtamart.com", role: "Store Manager", status: "Active", joined: "12 Jan 2026" },
  { id: 2, name: "Priya Sharma", email: "priya.s@mehtamart.com", role: "Inventory Lead", status: "Active", joined: "05 Feb 2026" },
  { id: 3, name: "Rahul Verma", email: "rahul.v@mehtamart.com", role: "Support Executive", status: "On Leave", joined: "20 Feb 2026" },
  { id: 4, name: "Sana Khan", email: "sana.k@mehtamart.com", role: "SEO Specialist", status: "Active", joined: "01 Mar 2026" },
];

const StaffTab = () => {
  const [staffList] = useState(INITIAL_STAFF);
  const [showPasswordId, setShowPasswordId] = useState(null);

  // Function to download staff data as CSV
  const downloadStaffReport = () => {
    const headers = ["Name,Email,Role,Status,Joined\n"];
    const rows = staffList.map(s => `${s.name},${s.email},${s.role},${s.status},${s.joined}\n`);
    const blob = new Blob([headers, ...rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "staff_report.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-700 font-sans max-w-[1600px] mx-auto">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Staff Directory</h2>
          <p className="text-sm text-slate-500 font-medium">Manage internal team members and access levels.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadStaffReport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
          >
            <Download size={16} />
            Download CSV
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all cursor-pointer shadow-md shadow-indigo-100">
            <Plus size={18} />
            Add Staff
          </button>
        </div>
      </div>

      {/* 2. TABLE CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact & Security</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                  {/* Member Info */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100 shrink-0">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">{staff.name}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={10} /> Joined {staff.joined}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Position */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
                      <Briefcase size={14} className="text-slate-300" />
                      {staff.role}
                    </div>
                  </td>

                  {/* Credentials */}
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[13px] text-slate-600">
                        <Mail size={13} className="text-slate-300" />
                        {staff.email}
                      </div>
                      <div className="flex items-center gap-2 group/pass">
                        <span className="text-xs font-mono text-slate-400 tracking-wider">
                          {showPasswordId === staff.id ? "Admin@2026!" : "••••••••"}
                        </span>
                        <button 
                          onClick={() => setShowPasswordId(showPasswordId === staff.id ? null : staff.id)}
                          className="text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {showPasswordId === staff.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      staff.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      <span className={`w-1 h-1 rounded-full mr-1.5 ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {staff.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer">
                        <Edit2 size={15} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. PAGINATION / FOOTER */}
        <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-500">
            Displaying <span className="text-slate-900 font-semibold">{staffList.length}</span> staff members in the organization
          </p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">Previous</button>
            <button className="w-8 h-8 flex items-center justify-center text-xs font-bold text-indigo-600 bg-white border border-indigo-100 rounded-lg shadow-sm">1</button>
            <button className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffTab;