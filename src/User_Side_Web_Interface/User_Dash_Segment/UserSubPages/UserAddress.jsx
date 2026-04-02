import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom"; // Added for cleaner rendering
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  MapPin, Plus, Home, Briefcase, Star,
  Pencil, Trash2, X, RefreshCw, AlertCircle, CheckCircle2,
  ChevronRight, ChevronLeft
} from "lucide-react";

import {
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  clearAddressErrors,
  selectDefaultAddress,
  selectOtherAddresses,
  selectAddressLoading,
  selectAddressError,
} from "../../../components/REDUX_FEATURES/REDUX_SLICES/Useraddressslice";

// ─────────────────────────────────────────────────────────────────────────────
// Shared Sub-Components
// ─────────────────────────────────────────────────────────────────────────────

const Field = ({ label, name, value, onChange, required, type = "text", placeholder, maxLength }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className="bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold outline-none transition-all w-full cursor-pointer focus:cursor-text"
    />
  </div>
);

const ADDRESS_TYPE_ICON = {
  home: <Home size={15} className="text-[#F7A221]" />,
  work: <Briefcase size={15} className="text-blue-500" />,
  other: <MapPin size={15} className="text-gray-400" />,
};

const EMPTY_FORM = {
  fullName: "", phone: "", houseNumber: "", area: "",
  landmark: "", addressLine1: "", addressLine2: "",
  city: "", state: "", postalCode: "", country: "India",
  addressType: "home", isDefault: false,
  isGift: false, deliveryInstructions: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Address Card
// ─────────────────────────────────────────────────────────────────────────────
const AddressCard = ({ address, isDefault, onEdit, onDelete, onSetDefault, isDeleting }) => (
  <div className={`p-4 sm:p-6 bg-white rounded-2xl sm:rounded-[32px] relative overflow-hidden transition-all duration-300 border-2 cursor-pointer hover:shadow-xl ${
    isDefault ? "border-black shadow-xl ring-4 ring-black/5" : "border-gray-100 hover:border-black"
  }`}>

    {/* Default badge */}
    {isDefault && (
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 bg-black text-white text-[9px] font-black uppercase tracking-widest px-2.5 sm:px-3 py-1.5 rounded-full">
        <Star size={10} className="fill-[#F7A221] text-[#F7A221]" />
        <span className="hidden sm:inline">Default</span>
      </div>
    )}

    {/* Type */}
    <div className="flex items-center gap-2 mb-3 sm:mb-4">
      <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg">
        {ADDRESS_TYPE_ICON[address.addressType] || ADDRESS_TYPE_ICON.other}
      </div>
      <span className="font-black uppercase text-[10px] tracking-widest text-gray-400">
        {address.addressType}
      </span>
    </div>

    {/* Name + Phone */}
    <h4 className="font-black text-gray-900 text-sm sm:text-base">{address.fullName}</h4>
    <p className="text-xs text-gray-400 font-bold mb-3 sm:mb-4">{address.phone}</p>

    {/* Address */}
    <p className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed min-h-[50px] sm:min-h-[60px]">
      {[address.houseNumber, address.area, address.landmark, address.addressLine1, address.addressLine2]
        .filter(Boolean)
        .join(", ")}
      <br />
      <span className="text-gray-900 font-bold">
        {address.city}, {address.state} — {address.postalCode}
      </span>
    </p>

    {/* Actions */}
    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-50 flex items-center gap-2 sm:gap-4">
      {!isDefault && (
        <button
          onClick={(e) => { e.stopPropagation(); onSetDefault(address); }}
          className="text-[10px] font-black uppercase tracking-widest text-[#F7A221] hover:underline cursor-pointer whitespace-nowrap"
        >
          Set Default
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(address); }}
        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black cursor-pointer"
      >
        <Pencil size={12} />
        <span className="hidden sm:inline">Edit</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(address._id); }}
        disabled={isDeleting}
        className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
      >
        {isDeleting
          ? <RefreshCw size={12} className="animate-spin" />
          : <Trash2 size={12} />
        }
        <span className="hidden sm:inline">
          {isDeleting ? "Deleting..." : "Delete"}
        </span>
      </button>
    </div>

  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Address Form Modal (Fixed Flicker)
// ─────────────────────────────────────────────────────────────────────────────
const AddressFormModal = ({ initial, onSubmit, onClose, isSaving, error }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    // Calculate scrollbar width to prevent "flicker/jump"
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollBarWidth}px`; // Compensate for scrollbar removal

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const val = value.replace(/\D/g, "");
      if (val.length <= 10) setForm((prev) => ({ ...prev, [name]: val }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const toggleBoolean = (key) => setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  const setType = (type) => setForm((prev) => ({ ...prev, addressType: type }));

  const validateStep = (currentStep) => {
    setFormError(null);
    if (currentStep === 1) {
      if (!form.fullName.trim()) return "Full Name is required";
      if (form.phone.length !== 10) return "Phone number must be exactly 10 digits";
    }
    if (currentStep === 2) {
      const req = ["houseNumber", "area", "city", "state", "postalCode"];
      for (const f of req) if (!form[f]?.trim()) return `${f.replace(/([A-Z])/g, ' $1')} is required`;
      if (!/^\d{6}$/.test(form.postalCode)) return "Postal code must be 6 digits";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) setFormError(err);
    else setStep(step + 1);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    const err = validateStep(step);
    if (err) { setFormError(err); return; }
    
    const submissionData = { ...form };
    Object.keys(submissionData).forEach(key => {
        if (submissionData[key] === "") submissionData[key] = null;
    });
    onSubmit(submissionData);
  };

  // Using Portals to move modal to top level of DOM
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-[40px] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-50">
          <div className="flex items-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= s ? "bg-black" : "bg-gray-100"}`} />
            ))}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            {step === 1 && "Personal Info"}
            {step === 2 && "Address Details"}
            {step === 3 && "Preferences"}
          </h2>

          {(formError || error) && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700">{formError || error?.message || "Internal Server Error"}</p>
            </div>
          )}

          <div className="space-y-5">
            {step === 1 && (
              <>
                <Field label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} required placeholder="Ravi Kumar" />
                <Field label="Phone Number" name="phone" value={form.phone} onChange={handleChange} required type="tel" placeholder="10-digit number" />
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="House No." name="houseNumber" value={form.houseNumber} onChange={handleChange} required placeholder="42B" />
                  <Field label="Area" name="area" value={form.area} onChange={handleChange} required placeholder="Sector 12" />
                </div>
                <Field label="Landmark" name="landmark" value={form.landmark} onChange={handleChange} placeholder="Near City Mall" />
                <Field label="Address Line 1" name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Building name, Floor etc." />
                <Field label="Address Line 2" name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Additional details" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City" name="city" value={form.city} onChange={handleChange} required placeholder="Mumbai" />
                  <Field label="Pincode" name="postalCode" value={form.postalCode} onChange={handleChange} required placeholder="400001" maxLength={6} />
                </div>
                <Field label="State" name="state" value={form.state} onChange={handleChange} required placeholder="Maharashtra" />
              </>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Address Type</label>
                  <div className="flex gap-2">
                    {["home", "work", "other"].map((t) => (
                      <button 
                        key={t} 
                        type="button" 
                        onClick={() => setType(t)} 
                        className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
                          form.addressType === t 
                            ? "bg-black text-white border-black" 
                            : "bg-gray-50 text-gray-400 border-transparent hover:border-gray-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Delivery Instructions" name="deliveryInstructions" value={form.deliveryInstructions} onChange={handleChange} placeholder="Ring bell/Call on arrival" />
                <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleBoolean("isDefault")}>
                    <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Default Address</span>
                    <div className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${form.isDefault ? "bg-black" : "bg-gray-200"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isDefault ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleBoolean("isGift")}>
                    <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Is this a gift? 🎁</span>
                    <div className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${form.isGift ? "bg-[#F7A221]" : "bg-gray-200"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isGift ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)} 
              className="px-6 py-4 rounded-2xl border-2 border-gray-200 font-black text-[10px] uppercase tracking-widest hover:border-black transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {step < 3 ? (
            <button 
              onClick={handleNext} 
              className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleFinalSubmit} 
              disabled={isSaving} 
              className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : initial ? "Update Address" : "Save Address"}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UserAddress — Main Component
// ─────────────────────────────────────────────────────────────────────────────
const UserAddress = () => {
  const dispatch = useDispatch();
  const defaultAddress = useSelector(selectDefaultAddress);
  const otherAddresses = useSelector(selectOtherAddresses);
  const loading = useSelector(selectAddressLoading);
  const error = useSelector(selectAddressError);

  const [modalOpen, setModalOpen] = useState(false);
  const [editAddress, setEditAddress] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    dispatch(fetchAddresses());
    return () => dispatch(clearAddressErrors());
  }, [dispatch]);

  const showSuccess = (msg) => {
    toast.success(msg, { theme: "dark" });
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg) => {
    toast.error(msg, { theme: "dark" });
  };

  const openAdd = () => { setEditAddress(null); setModalOpen(true); dispatch(clearAddressErrors()); };
  const openEdit = (addr) => { setEditAddress(addr); setModalOpen(true); dispatch(clearAddressErrors()); };
  const closeModal = () => { setModalOpen(false); setEditAddress(null); };

  const handleSubmit = async (formData) => {
    try {
      if (editAddress) {
        await dispatch(updateAddress({ id: editAddress._id, ...formData })).unwrap();
        showSuccess("Address updated successfully!");
      } else {
        await dispatch(addAddress(formData)).unwrap();
        showSuccess("Address added successfully!");
      }
      closeModal();
    } catch (e) { 
      showError(e?.message || "Failed to save address");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    setDeletingId(id);
    try {
      await dispatch(deleteAddress(id)).unwrap();
      showSuccess("Address removed successfully");
    } catch (e) { 
      showError(e?.message || "Failed to delete address");
    } finally { setDeletingId(null); }
  };

  const handleSetDefault = async (addr) => {
    try {
      await dispatch(updateAddress({ id: addr._id, isDefault: true })).unwrap();
      showSuccess("Default address updated");
    } catch (e) { 
      showError(e?.message || "Failed to set default address");
    }
  };

  const allCount = (defaultAddress ? 1 : 0) + otherAddresses.length;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-10 pb-8 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Saved Addresses</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{allCount} Total</p>
        </div>
        <button 
          onClick={openAdd} 
          className="bg-black text-white px-3 py-2 rounded-2xl flex gap-1 font-black uppercase tracking-widest items-center shadow-xl active:scale-95 transition-all cursor-pointer hover:bg-[#F7A221] hover:text-black"
        >
          <Plus size={18} className="inline mr-2" /> <h1 className="text-[0.8rem]">Add</h1>
        </button>
      </div>

      {error.fetch && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-xs font-bold text-red-700 flex-1">{error.fetch.message || "Failed to load"}</p>
          <button onClick={() => dispatch(fetchAddresses())} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 cursor-pointer">Retry</button>
        </div>
      )}

      {loading.fetch ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-gray-50 rounded-[40px] animate-pulse" />)}
        </div>
      ) : allCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
            <MapPin size={40} className="text-gray-300" />
          </div>
          <h3 className="font-black text-gray-900 text-xl">No addresses yet</h3>
          <button onClick={openAdd} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F7A221] transition-all cursor-pointer">
            <Plus size={16} className="inline mr-2" /> Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {defaultAddress && (
            <AddressCard address={defaultAddress} isDefault onEdit={openEdit} onDelete={handleDelete} onSetDefault={handleSetDefault} isDeleting={deletingId === defaultAddress._id} />
          )}
          {otherAddresses.map((addr) => (
            <AddressCard key={addr._id} address={addr} isDefault={false} onEdit={openEdit} onDelete={handleDelete} onSetDefault={handleSetDefault} isDeleting={deletingId === addr._id} />
          ))}
        </div>
      )}

      {modalOpen && (
        <AddressFormModal
          initial={editAddress}
          onSubmit={handleSubmit}
          onClose={closeModal}
          isSaving={loading.add || loading.update}
          error={error.add || error.update}
        />
      )}
    </div>
  );
};

export default UserAddress;
// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   MapPin, Plus, Home, Briefcase, Star,
//   Pencil, Trash2, X, RefreshCw, AlertCircle, CheckCircle2,
// } from "lucide-react";

// import {
//   fetchAddresses,
//   addAddress,
//   updateAddress,
//   deleteAddress,
//   clearAddressErrors,
//   selectDefaultAddress,
//   selectOtherAddresses,
//   selectAddressLoading,
//   selectAddressError,
// } from "../../../components/REDUX_FEATURES/REDUX_SLICES/Useraddressslice"; //Right Path

// // ─────────────────────────────────────────────────────────────────────────────
// // Helpers
// // ─────────────────────────────────────────────────────────────────────────────
// const logError = (context, error, info = {}) => {
//   console.group(`🔴 [UserAddress] ERROR in ${context}`);
//   console.error("Error:", error);
//   console.log("Info:", info);
//   console.groupEnd();
// };

// const ADDRESS_TYPE_ICON = {
//   home:  <Home size={15} className="text-[#F7A221]" />,
//   work:  <Briefcase size={15} className="text-blue-500" />,
//   other: <MapPin size={15} className="text-gray-400" />,
// };

// const EMPTY_FORM = {
//   fullName: "", phone: "", houseNumber: "", area: "",
//   landmark: "", addressLine1: "", addressLine2: "",
//   city: "", state: "", postalCode: "", country: "India",
//   addressType: "home", isDefault: false,
//   isGift: false, deliveryInstructions: "",
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Address Card
// // ─────────────────────────────────────────────────────────────────────────────
// const AddressCard = ({ address, isDefault, onEdit, onDelete, onSetDefault, isDeleting }) => (
//   <div className={`p-6 bg-white rounded-[32px] relative overflow-hidden transition-all duration-300 ${
//     isDefault
//       ? "border-4 border-black shadow-lg"
//       : "border-2 border-gray-100 hover:border-black"
//   }`}>
//     {/* Default badge */}
//     {isDefault && (
//       <div className="absolute top-4 right-4 flex items-center gap-1 bg-black text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
//         <Star size={10} className="fill-[#F7A221] text-[#F7A221]" />
//         Default
//       </div>
//     )}

//     {/* Type label */}
//     <div className="flex items-center gap-2 mb-3">
//       {ADDRESS_TYPE_ICON[address.addressType] || ADDRESS_TYPE_ICON.other}
//       <span className="font-black uppercase text-[10px] tracking-widest text-gray-500 capitalize">
//         {address.addressType}
//       </span>
//     </div>

//     {/* Name + phone */}
//     <p className="font-black text-gray-900 text-sm mb-1">{address.fullName}</p>
//     <p className="text-xs text-gray-500 font-semibold mb-3">{address.phone}</p>

//     {/* Address lines */}
//     <p className="font-medium text-gray-700 text-sm leading-relaxed">
//       {[
//         address.houseNumber,
//         address.area,
//         address.landmark,
//         address.addressLine1,
//         address.addressLine2,
//       ].filter(Boolean).join(", ")}
//       <br />
//       {address.city}, {address.state} – {address.postalCode}
//       <br />
//       {address.country}
//     </p>

//     {/* Delivery instructions */}
//     {address.deliveryInstructions && (
//       <p className="text-[10px] text-gray-400 mt-2 italic">
//         📝 {address.deliveryInstructions}
//       </p>
//     )}

//     {/* Actions */}
//     <div className="mt-5 flex items-center gap-4 flex-wrap">
//       {!isDefault && (
//         <button
//           onClick={() => onSetDefault(address)}
//           className="text-[10px] font-black uppercase tracking-wider text-[#F7A221] hover:text-black transition-colors"
//         >
//           Set as Default
//         </button>
//       )}
//       <button
//         onClick={() => onEdit(address)}
//         className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-black transition-colors"
//       >
//         <Pencil size={11} /> Edit
//       </button>
//       <button
//         onClick={() => onDelete(address._id)}
//         disabled={isDeleting}
//         className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
//       >
//         {isDeleting
//           ? <RefreshCw size={11} className="animate-spin" />
//           : <Trash2 size={11} />
//         }
//         {isDeleting ? "Removing…" : "Remove"}
//       </button>
//     </div>
//   </div>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // Address Form Modal
// // ─────────────────────────────────────────────────────────────────────────────
// const AddressFormModal = ({ initial, onSubmit, onClose, isSaving, error }) => {
//   const [form, setForm] = useState(initial || EMPTY_FORM);
//   const [formError, setFormError] = useState(null);

//   const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

//   const validate = () => {
//     const required = ["fullName", "phone", "houseNumber", "area", "city", "state", "postalCode"];
//     for (const field of required) {
//       if (!form[field]?.trim()) {
//         return `${field.replace(/([A-Z])/g, " $1")} is required`;
//       }
//     }
//     if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) {
//       return "Phone must be 10 digits";
//     }
//     if (!/^\d{6}$/.test(form.postalCode)) {
//       return "Postal code must be 6 digits";
//     }
//     return null;
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const err = validate();
//     if (err) { setFormError(err); return; }
//     setFormError(null);
//     onSubmit(form);
//   };

//   const Field = ({ label, name, required, type = "text", placeholder }) => (
//     <div className="flex flex-col gap-1">
//       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
//         {label}{required && <span className="text-red-400 ml-1">*</span>}
//       </label>
//       <input
//         type={type}
//         value={form[name]}
//         onChange={(e) => set(name, e.target.value)}
//         placeholder={placeholder}
//         className="border-2 border-gray-100 focus:border-black rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-colors"
//       />
//     </div>
//   );

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       {/* Overlay */}
//       <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

//       {/* Modal */}
//       <div className="relative bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
//         {/* Header */}
//         <div className="sticky top-0 bg-white px-8 pt-8 pb-4 border-b border-gray-100 flex items-center justify-between z-10 rounded-t-[32px]">
//           <h2 className="text-xl font-black tracking-tight">
//             {initial ? "Edit Address" : "Add New Address"}
//           </h2>
//           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
//             <X size={20} />
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">

//           {/* Error */}
//           {(formError || error) && (
//             <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
//               <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
//               <p className="text-xs font-semibold text-red-700">
//                 {formError || error?.message || "Something went wrong"}
//               </p>
//             </div>
//           )}

//           {/* Personal info */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <Field label="Full Name" name="fullName" required placeholder="Ravi Kumar" />
//             <Field label="Phone" name="phone" required type="tel" placeholder="9876543210" />
//           </div>

//           {/* Address */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <Field label="House / Flat No." name="houseNumber" required placeholder="42B" />
//             <Field label="Area / Colony" name="area" required placeholder="HSR Layout" />
//           </div>
//           <Field label="Landmark" name="landmark" placeholder="Near HDFC Bank" />
//           <Field label="Address Line 1" name="addressLine1" placeholder="Sector 3, Block A" />
//           <Field label="Address Line 2" name="addressLine2" placeholder="Opposite Metro Station" />

//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//             <Field label="City" name="city" required placeholder="Bangalore" />
//             <Field label="State" name="state" required placeholder="Karnataka" />
//             <Field label="Postal Code" name="postalCode" required placeholder="560102" />
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <Field label="Country" name="country" placeholder="India" />

//             {/* Address type */}
//             <div className="flex flex-col gap-1">
//               <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
//                 Address Type
//               </label>
//               <div className="flex gap-2">
//                 {["home", "work", "other"].map((t) => (
//                   <button
//                     key={t}
//                     type="button"
//                     onClick={() => set("addressType", t)}
//                     className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl border-2 transition-all ${
//                       form.addressType === t
//                         ? "border-black bg-black text-white"
//                         : "border-gray-100 text-gray-500 hover:border-gray-300"
//                     }`}
//                   >
//                     {t}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           <Field
//             label="Delivery Instructions"
//             name="deliveryInstructions"
//             placeholder="Leave at door, ring bell twice…"
//           />

//           {/* Toggles */}
//           <div className="flex flex-wrap gap-6">
//             <label className="flex items-center gap-3 cursor-pointer group">
//               <div
//                 onClick={() => set("isDefault", !form.isDefault)}
//                 className={`w-12 h-6 rounded-full transition-colors relative ${
//                   form.isDefault ? "bg-black" : "bg-gray-200"
//                 }`}
//               >
//                 <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
//                   form.isDefault ? "translate-x-7" : "translate-x-1"
//                 }`} />
//               </div>
//               <span className="text-xs font-black uppercase tracking-wider text-gray-600 group-hover:text-black transition-colors">
//                 Set as Default
//               </span>
//             </label>

//             <label className="flex items-center gap-3 cursor-pointer group">
//               <div
//                 onClick={() => set("isGift", !form.isGift)}
//                 className={`w-12 h-6 rounded-full transition-colors relative ${
//                   form.isGift ? "bg-[#F7A221]" : "bg-gray-200"
//                 }`}
//               >
//                 <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
//                   form.isGift ? "translate-x-7" : "translate-x-1"
//                 }`} />
//               </div>
//               <span className="text-xs font-black uppercase tracking-wider text-gray-600 group-hover:text-black transition-colors">
//                 Gift Address 🎁
//               </span>
//             </label>
//           </div>

//           {/* Submit */}
//           <div className="flex gap-3 pt-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 py-4 border-2 border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 hover:border-black transition-all active:scale-95"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isSaving}
//               className="flex-1 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#F7A221] hover:text-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
//             >
//               {isSaving ? (
//                 <><RefreshCw size={14} className="animate-spin" /> Saving…</>
//               ) : (
//                 initial ? "Update Address" : "Save Address"
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // UserAddress — Main Page
// // ─────────────────────────────────────────────────────────────────────────────
// const UserAddress = () => {
//   const dispatch = useDispatch();

//   const defaultAddress = useSelector(selectDefaultAddress);
//   const otherAddresses = useSelector(selectOtherAddresses);
//   const loading        = useSelector(selectAddressLoading);
//   const error          = useSelector(selectAddressError);

//   const [modalOpen,    setModalOpen]    = useState(false);
//   const [editAddress,  setEditAddress]  = useState(null);   // null = add mode
//   const [deletingId,   setDeletingId]   = useState(null);
//   const [successMsg,   setSuccessMsg]   = useState(null);

//   // ── Fetch on mount ─────────────────────────────────────────────────────────
//   useEffect(() => {
//     dispatch(fetchAddresses())
//       .unwrap()
//       .then(() => console.log("✅ [UserAddress] addresses loaded"))
//       .catch((e) => logError("fetchAddresses", e));

//     return () => dispatch(clearAddressErrors());
//   }, [dispatch]);

//   // ── Show success message briefly ───────────────────────────────────────────
//   const showSuccess = (msg) => {
//     setSuccessMsg(msg);
//     setTimeout(() => setSuccessMsg(null), 3000);
//   };

//   // ── Handlers ──────────────────────────────────────────────────────────────
//   const openAdd  = () => { setEditAddress(null); setModalOpen(true); dispatch(clearAddressErrors()); };
//   const openEdit = (addr) => { setEditAddress(addr); setModalOpen(true); dispatch(clearAddressErrors()); };
//   const closeModal = () => { setModalOpen(false); setEditAddress(null); };

//   const handleSubmit = async (formData) => {
//     try {
//       if (editAddress) {
//         await dispatch(updateAddress({ id: editAddress._id, ...formData })).unwrap();
//         showSuccess("Address updated successfully");
//         console.log(`✅ [UserAddress] updated: ${editAddress._id}`);
//       } else {
//         await dispatch(addAddress(formData)).unwrap();
//         showSuccess("Address added successfully");
//         console.log("✅ [UserAddress] new address added");
//       }
//       closeModal();
//     } catch (e) {
//       logError(editAddress ? "updateAddress" : "addAddress", e, { formData });
//       // error already in Redux state — modal stays open and shows error
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Remove this address?")) return;
//     setDeletingId(id);
//     try {
//       await dispatch(deleteAddress(id)).unwrap();
//       showSuccess("Address removed");
//       console.log(`✅ [UserAddress] deleted: ${id}`);
//     } catch (e) {
//       logError("deleteAddress", e, { id });
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const handleSetDefault = async (addr) => {
//     try {
//       await dispatch(updateAddress({ id: addr._id, isDefault: true })).unwrap();
//       showSuccess("Default address updated");
//       console.log(`✅ [UserAddress] set default: ${addr._id}`);
//     } catch (e) {
//       logError("handleSetDefault", e, { id: addr._id });
//     }
//   };

//   const allCount = (defaultAddress ? 1 : 0) + otherAddresses.length;
//   const isSaving = loading.add || loading.update;

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <div className="space-y-8">

//       {/* Header */}
//       <div className="flex justify-between items-center flex-wrap gap-4">
//         <div>
//           <h1 className="text-3xl font-black text-gray-900 tracking-tight">
//             Delivery Addresses
//           </h1>
//           {!loading.fetch && (
//             <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mt-1">
//               {allCount} saved address{allCount !== 1 ? "es" : ""}
//             </p>
//           )}
//         </div>
//         <button
//           onClick={openAdd}
//           className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F7A221] hover:text-black transition-all active:scale-95 shadow-lg"
//         >
//           <Plus size={16} /> Add New
//         </button>
//       </div>

//       {/* Success banner */}
//       {successMsg && (
//         <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-3">
//           <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
//           <p className="text-xs font-bold text-green-700">{successMsg}</p>
//         </div>
//       )}

//       {/* Fetch error */}
//       {error.fetch && (
//         <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
//           <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
//           <div className="flex-1">
//             <p className="text-xs font-bold text-red-700">
//               {error.fetch.message || "Failed to load addresses"}
//             </p>
//           </div>
//           <button
//             onClick={() => dispatch(fetchAddresses())}
//             className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors whitespace-nowrap"
//           >
//             Retry
//           </button>
//         </div>
//       )}

//       {/* Delete error */}
//       {error.delete && (
//         <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-3">
//           <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
//           <p className="text-xs font-semibold text-red-700 flex-1">
//             {error.delete.message || "Failed to remove address"}
//           </p>
//           <button onClick={() => dispatch(clearAddressErrors())} className="text-red-300 hover:text-red-500">
//             <X size={14} />
//           </button>
//         </div>
//       )}

//       {/* Loading skeleton */}
//       {loading.fetch && (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {[...Array(2)].map((_, i) => (
//             <div key={i} className="h-52 bg-gray-100 rounded-[32px] animate-pulse" />
//           ))}
//         </div>
//       )}

//       {/* Empty state */}
//       {!loading.fetch && allCount === 0 && !error.fetch && (
//         <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
//           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
//             <MapPin size={32} className="text-gray-200" />
//           </div>
//           <div>
//             <h3 className="font-black text-gray-900 uppercase tracking-tight mb-1">
//               No addresses yet
//             </h3>
//             <p className="text-gray-400 text-sm font-medium">
//               Add your first delivery address to get started
//             </p>
//           </div>
//           <button
//             onClick={openAdd}
//             className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F7A221] hover:text-black transition-all active:scale-95"
//           >
//             <Plus size={16} /> Add Address
//           </button>
//         </div>
//       )}

//       {/* Address cards */}
//       {!loading.fetch && allCount > 0 && (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* Default first */}
//           {defaultAddress && (
//             <AddressCard
//               key={defaultAddress._id}
//               address={defaultAddress}
//               isDefault
//               onEdit={openEdit}
//               onDelete={handleDelete}
//               onSetDefault={handleSetDefault}
//               isDeleting={deletingId === defaultAddress._id}
//             />
//           )}
//           {/* Others */}
//           {otherAddresses.map((addr) => (
//             <AddressCard
//               key={addr._id}
//               address={addr}
//               isDefault={false}
//               onEdit={openEdit}
//               onDelete={handleDelete}
//               onSetDefault={handleSetDefault}
//               isDeleting={deletingId === addr._id}
//             />
//           ))}
//         </div>
//       )}

//       {/* Add / Edit Modal */}
//       {modalOpen && (
//         <AddressFormModal
//           initial={editAddress}
//           onSubmit={handleSubmit}
//           onClose={closeModal}
//           isSaving={isSaving}
//           error={error.add || error.update}
//         />
//       )}
//     </div>
//   );
// };

// export default UserAddress;

// import React from 'react';
// import { MapPin, Plus, Home, Briefcase } from 'lucide-react';

// const UserAddress = () => {
//   return (
//     <div className="space-y-8">
//       <div className="flex justify-between items-center">
//         <h1 className="text-3xl font-black text-gray-900 tracking-tight">Delivery Addresses</h1>
//         <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg">
//           <Plus size={18} /> Add New
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="p-6 bg-white border-4 border-black rounded-[32px] relative overflow-hidden">
//             <div className="flex items-center gap-2 mb-4">
//                 <Home size={18} className="text-orange-500" />
//                 <span className="font-black uppercase text-[10px] tracking-widest">Default - Home</span>
//             </div>
//             <p className="font-bold text-gray-900 leading-relaxed">
//                 123 Sky Tower, HSR Layout<br />
//                 Bangalore, Karnataka 560102<br />
//                 India
//             </p>
//             <div className="mt-6 flex gap-4">
//                 <button className="text-xs font-black uppercase text-gray-400 hover:text-black">Edit</button>
//                 <button className="text-xs font-black uppercase text-red-500 hover:text-red-700">Remove</button>
//             </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserAddress;