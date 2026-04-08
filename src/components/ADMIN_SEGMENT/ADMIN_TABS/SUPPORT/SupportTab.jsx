import React from "react";

const SupportTab = () => {
  // Business logic for "Live" status (9 AM - 6 PM, Mon-Sat)
  const now = new Date();
  const day = now.getDay(); 
  const hour = now.getHours();
  const isOpen = day >= 1 && day <= 6 && hour >= 9 && hour < 18;

  const supportOptions = [
    {
      id: 1,
      title: "WhatsApp Support",
      detail: "+91 8690720398", 
      actionText: "Chat Now",
      icon: (
        <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      link: "https://wa.me/918690720398?text=Hello%20BigFeatherTechnology%2C%20I%20need%20assistance%20with%20my%20dashboard.",
      color: "bg-[#25D366]/10",
    },
    {
      id: 2,
      title: "Email Inquiry",
      detail: "feathers.big@gmail.com",
      actionText: "Send Email",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      link: "mailto:feathers.big@gmail.com",
      color: "bg-blue-50",
    },
    {
      id: 3,
      title: "Phone Support",
      detail: "+91 8690720398", 
      actionText: "Call Now",
      icon: (
        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      link: "tel:+918690720398",
      color: "bg-slate-100",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Help & Support</h1>
            <p className="text-slate-500 mt-1 text-[15px]">
              Our technical team at BigFeatherTechnology is here to assist with your business operations.
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isOpen ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
            <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
            <span className="text-xs font-bold uppercase tracking-wider">{isOpen ? "Live Support Active" : "Support Offline"}</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Working Hours</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Monday - Saturday</span>
                <span className="text-slate-900 font-bold">09:00 AM - 06:00 PM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 font-medium">Sunday</span>
                <span className="text-rose-500 font-bold ">Closed</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Response Time Policy</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              We aim to respond to all technical inquiries within <span className="text-slate-900 font-bold">24 working hours</span>. For urgent dashboard issues, please use WhatsApp for immediate attention.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {supportOptions.map((option) => (
          <div key={option.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className={`w-12 h-12 rounded-lg ${option.color} flex items-center justify-center mb-4`}>
                {option.icon}
              </div>
              <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">{option.title}</h4>
              <p className="text-[15px] font-bold text-slate-800 mt-1 truncate">{option.detail}</p>
            </div>
            <a
              href={option.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold text-center hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {option.actionText}
            </a>
          </div>
        ))}
      </div>

      {/* Security Disclaimer */}
      <div className="flex flex-col items-center gap-2 justify-center py-6 border-t border-slate-100">
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase">BigFeatherTechnology Secure Support Channel</span>
        </div>
        <p className="text-[10px] text-slate-400/60 font-medium">© {new Date().getFullYear()} All Rights Reserved</p>
      </div>
    </div>
  );
};

export default SupportTab;