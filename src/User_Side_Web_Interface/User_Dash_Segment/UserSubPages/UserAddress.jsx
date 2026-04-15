  import React, { useEffect, useState, useCallback, useRef } from "react";
  import { createPortal } from "react-dom";
  import { useDispatch, useSelector } from "react-redux";
  import { toast } from "react-toastify";
  import {
    MapPin, Plus, Home, Briefcase, Star,
    Pencil, Trash2, X, RefreshCw, AlertCircle,
    ChevronRight, ChevronLeft, Loader2,
  } from "lucide-react";

  import {
    fetchAddresses, addAddress, updateAddress, deleteAddress,
    clearAddressErrors, selectDefaultAddress, selectOtherAddresses,
    selectAddressLoading, selectAddressError,
  } from "../../../components/REDUX_FEATURES/REDUX_SLICES/Useraddressslice";
  import useAutoComplete from "../../../components/HOOKS/useAutoComplete";

  // ─────────────────────────────────────────────────────────────────────────────
  // Constants
  // ─────────────────────────────────────────────────────────────────────────────
  const ADDRESS_TYPE_ICON = {
    home:  <Home size={15} className="text-[#F7A221]" />,
    work:  <Briefcase size={15} className="text-blue-500" />,
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
  // Field — generic input with optional autocomplete dropdown
  // ─────────────────────────────────────────────────────────────────────────────
  const Field = ({
    label, name, value, onChange, required,
    type = "text", placeholder, maxLength,
    suggestions = [],
    onSuggestionSelect,
    loading = false,
  }) => (
    <div className="flex flex-col gap-1.5 w-full relative">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          className="bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold outline-none transition-all w-full cursor-pointer focus:cursor-text"
        />
        {/* Loading spinner inside input */}
      {!loading && value?.length > 3 && suggestions?.length === 0 && (
    <div className="text-xs text-gray-400 px-2 mt-1">
      No results found
    </div>
  )}
      </div>

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {suggestions.slice(0, 6).map((item, i) => (
            <li
              key={i}
              onMouseDown={() => onSuggestionSelect?.(item)}
              className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 truncate"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Address Card
  // ─────────────────────────────────────────────────────────────────────────────
  const AddressCard = ({ address, isDefault, onEdit, onDelete, onSetDefault, isDeleting }) => (
    <div className={`p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] relative overflow-hidden transition-all duration-300 border-2 cursor-pointer hover:shadow-xl ${
      isDefault ? "border-black shadow-xl ring-4 ring-black/5" : "border-gray-100 hover:border-black"
    }`}>
      {isDefault && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
          <Star size={10} className="fill-[#F7A221] text-[#F7A221]" />
          <span>Default</span>
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gray-50 rounded-xl">
          {ADDRESS_TYPE_ICON[address.addressType] || ADDRESS_TYPE_ICON.other}
        </div>
        <span className="font-black uppercase text-[10px] tracking-widest text-gray-400">
          {address.addressType}
        </span>
      </div>
      <h4 className="font-black text-gray-900 text-base leading-tight pr-20">{address.fullName}</h4>
      <p className="text-xs text-gray-400 font-bold mt-0.5 mb-4">{address.phone}</p>
      <p className="text-sm font-medium text-gray-600 leading-relaxed">
        {[address.houseNumber, address.area, address.landmark, address.addressLine1, address.addressLine2]
          .filter(Boolean).join(", ")}
        <br />
        <span className="text-gray-900 font-bold">
          {address.city}, {address.state} — {address.postalCode}
        </span>
      </p>
      <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3">
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
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black cursor-pointer transition-colors"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(address._id); }}
          disabled={isDeleting}
          className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 disabled:opacity-30 cursor-pointer transition-colors"
        >
          {isDeleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // AddressFormModal
  // ─────────────────────────────────────────────────────────────────────────────
  const AddressFormModal = ({ initial, onSubmit, onClose, isSaving, error }) => {
  const [form, setForm] = useState({
  ...EMPTY_FORM,
  ...initial,
});
    const [step, setStep]             = useState(1);
    const [formError, setFormError]   = useState(null);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const dropdownRef = useRef(null);
    const [isSelected1, setIsSelected1] = useState(false);
const [isSelected2, setIsSelected2] = useState(false);
const [isTyping1, setIsTyping1] = useState(false);
const [isTyping2, setIsTyping2] = useState(false);

    // ── Autocomplete for address line fields (NOT pincode) ──
    // Only fires when 3+ chars typed
    const searchQuery1 = form.addressLine1?.length >= 3 ? form.addressLine1 : "";
    const searchQuery2 = form.addressLine2?.length >= 3 ? form.addressLine2 : "";
    const { result: raw1 = [], setResult: setRaw1, Loading: Loading1 } = useAutoComplete(searchQuery1, form.city, 500, form.lat, form.lon);
  const { result: raw2 = [],setResult: setRaw2, Loading:Loading2 } = useAutoComplete(searchQuery2,form.city, 500,form.lat, form.lon);
  const isSameCity = (place) => {
  const city =
    place.address?.city ||
    place.address?.town ||
    place.address?.village ||
    "";

  return city.toLowerCase().includes(form.city.toLowerCase());
};

const suggestions1 =
  searchQuery1.length >= 3 && isTyping1 && !isSelected1 ? raw1 : [];

const suggestions2 =
  searchQuery2.length >= 3 && isTyping2 && !isSelected2 ? raw2 : [];

    // Lock body scroll
    useEffect(() => {
      const sw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow     = "hidden";
      document.body.style.paddingRight = `${sw}px`;
      return () => {
        document.body.style.overflow     = "unset";
        document.body.style.paddingRight = "0px";
      };
    }, []);
    useEffect(() => {
  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setRaw1([]);
      setRaw2([]);
       setIsSelected1(false);
  setIsSelected2(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
useEffect(() => {
  setIsTyping1(false);
  setIsTyping2(false);
}, [initial]);

    // ── handleChange — generic field updater ──
    const handleChange = useCallback((e) => {
      const { name, value } = e.target;
     if (name === "addressLine1") {
  setIsSelected1(false);  // 🔥 allow suggestions again
    setIsTyping1(true);   // 🔥 USER IS TYPING
}

if (name === "addressLine2") {
  setIsSelected2(false);
    setIsTyping2(true);
}
      if (name === "phone") {
        const v = value.replace(/\D/g, "");
        if (v.length <= 10) setForm((p) => ({ ...p, phone: v }));
        return;
      }
      setForm((p) => ({ ...p, [name]: value }));
    }, []);

    // ── handlePincodeChange — fetches city/state from postalpincode.in ──
    // Simple, free, India-specific — no lat/lon, no reverse geocode needed
    const handlePincodeChange = async (value) => {
      // only digits
      if (!/^\d*$/.test(value)) return;

      // update the input immediately so user sees what they typed
      setForm((p) => ({ ...p, postalCode: value }));

      // wait for 6 digits
      if (value.length !== 6) return;

      setPincodeLoading(true);
      try {
        const res  = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await res.json();

        if (data[0]?.Status === "Success") {
          const po = data[0].PostOffice[0];
          // auto-fill city, state, area from pincode
          setForm((p) => ({
            ...p,
            postalCode: value,
            city:  po.District || p.city,
            state: po.State    || p.state,
            area:  po.Name     || p.area,
          }));
          toast.success(`📍 ${po.District}, ${po.State} detected!`, { autoClose: 2000 });
        } else {
          toast.error("Invalid pincode — city/state not found");
        }
      } catch (err) {
        console.error("Pincode API error:", err);
        toast.error("Could not fetch pincode details");
      } finally {
        setPincodeLoading(false);
      }
    };
    const handleClose = () => {
  setRaw1([]);
  setRaw2([]);
  setIsSelected1(false);
  setIsSelected2(false);
  onClose(); // parent wala close
};

    // ── Suggestion select handlers ──
 const handleSuggestionSelect1 = (place) => {
  setForm(p => ({
    ...p,
    addressLine1: place.display_name,
  }));

  setIsSelected1(true);  // 🔥 IMPORTANT
  setIsTyping1(false);
  setRaw1([]);
};

  const handleSuggestionSelect2 = (place) => {
  setForm(p => ({
    ...p,
    addressLine2: place.display_name,
  }));

  setIsSelected2(true);  // 🔥 IMPORTANT
  setIsTyping2(false);
  setRaw2([]);
};

    const toggleBoolean = (key) => setForm((p) => ({ ...p, [key]: !p[key] }));
    const setType       = (type) => setForm((p) => ({ ...p, addressType: type }));

    // ── Validation ──
    const validateStep = (s) => {
      setFormError(null);
      if (s === 1) {
        if (!form.fullName.trim())            return "Full Name is required";
        if (form.phone.length !== 10)         return "Phone must be exactly 10 digits";
        if (!/^\d{6}$/.test(form.postalCode)) return "Postal code must be 6 digits";
      }
      if (s === 2) {
        for (const f of ["houseNumber", "area", "city", "state", "postalCode"]) {
          if (!form[f]?.trim())
            return `${f.replace(/([A-Z])/g, " $1")} is required`;
        }
        if (!/^\d{6}$/.test(form.postalCode)) return "Postal code must be 6 digits";
      }
      return null;
    };

    const handleNext = () => {
      const err = validateStep(step);
      if (err) { setFormError(err); return; }
      setFormError(null);
      setStep((s) => s + 1);
    };

    const handleFinalSubmit = (e) => {
     e.preventDefault();

  const err = validateStep(step);
  if (err) { setFormError(err); return; }

  // 🔥 CLEAR SUGGESTIONS BEFORE SUBMIT
  setRaw1([]);
  setRaw2([]);
  setIsSelected1(true);
  setIsSelected2(true);

  const payload = { ...form };
  Object.keys(payload).forEach((k) => {
    if (payload[k] === "") payload[k] = null;
  });

  onSubmit(payload);
};

    return createPortal(
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

        <div className="relative bg-white rounded-[40px] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

          {/* Step indicator */}
          <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= s ? "bg-black" : "bg-gray-100"}`} />
              ))}
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              {step === 1 && "Personal Info"}
              {step === 2 && "Address Details"}
              {step === 3 && "Preferences"}
            </h2>

            {(formError || error) && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-xs font-bold text-red-700">
                  {formError || error?.message || "Something went wrong"}
                </p>
              </div>
            )}

            <div className="space-y-5">

              {/* ── Step 1: Personal Info ── */}
              {step === 1 && (
                <>
                  <Field
                    label="Full Name" name="fullName" value={form.fullName}
                    onChange={handleChange} required placeholder="Ravi Kumar"
                  />
                  <Field
                    label="Phone Number" name="phone" value={form.phone}
                    onChange={handleChange} required type="tel" placeholder="10-digit number"
                  />
                  {/* Pincode — auto-fills city/state on 6 digits */}
                  <Field
                    label="Pincode" name="postalCode" value={form.postalCode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    required placeholder="6-digit pincode" maxLength={6}
                    loading={pincodeLoading}
                  />
                  {/* Show auto-detected city/state as a preview */}
                  {form.city && form.state && (
                    <p className="text-xs text-green-600 font-bold ml-1">
                      📍 {form.city}, {form.state}
                    </p>
                  )}
                </>
              )}

              {/* ── Step 2: Address Details ── */}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="House No." name="houseNumber" value={form.houseNumber} onChange={handleChange} required placeholder="42B" />
                    <Field label="Area"       name="area"        value={form.area}        onChange={handleChange} required placeholder="Sector 12" />
                  </div>

                  <Field label="Landmark" name="landmark" value={form.landmark} onChange={handleChange} placeholder="Near City Mall" />

                  {/* Address Line 1 — with LocationIQ autocomplete */}
                  <div ref={dropdownRef}>
                      <Field
                    label="Address Line 1"
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    placeholder="Building name, Street etc."
                    suggestions={suggestions1}
                    loading={Loading1}
                    onSuggestionSelect={handleSuggestionSelect1}
                  />
                   <Field
                    label="Address Line 2"
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                    placeholder="Additional details"
                    suggestions={suggestions2}
                    loading={Loading2}
                    onSuggestionSelect={handleSuggestionSelect2}
                  />
                  </div>

                  {/* Address Line 2 — with LocationIQ autocomplete */}

                  <div className="grid grid-cols-2 gap-4">
                    {/* City — auto-filled from pincode, still editable */}
                    <Field label="City" name="city" value={form.city} onChange={handleChange} required placeholder="Mumbai" />
                    {/* Pincode — editable here too, re-triggers auto-fill */}
                    <Field
                      label="Pincode" name="postalCode" value={form.postalCode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      required placeholder="400001" maxLength={6}
                      loading={pincodeLoading}
                    />
                  </div>

                  {/* State — auto-filled from pincode, still editable */}
                  <Field label="State" name="state" value={form.state} onChange={handleChange} required placeholder="Maharashtra" />
                </>
              )}

              {/* ── Step 3: Preferences ── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Address Type
                    </label>
                    <div className="flex gap-2">
                      {["home", "work", "other"].map((t) => (
                        <button
                          key={t} type="button" onClick={() => setType(t)}
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

                  <Field
                    label="Delivery Instructions" name="deliveryInstructions"
                    value={form.deliveryInstructions} onChange={handleChange}
                    placeholder="Ring bell / Call on arrival"
                  />

                  <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                    {[
                      { key: "isDefault", label: "Default Address",    color: "bg-black"     },
                      { key: "isGift",    label: "Is this a gift? 🎁", color: "bg-[#F7A221]" },
                    ].map(({ key, label, color }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleBoolean(key)}
                      >
                        <span className="text-xs font-black text-gray-600 uppercase tracking-widest">{label}</span>
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${form[key] ? color : "bg-gray-200"}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form[key] ? "translate-x-5" : "translate-x-1"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
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
    const dispatch       = useDispatch();
    const defaultAddress = useSelector(selectDefaultAddress);
    const otherAddresses = useSelector(selectOtherAddresses);
    const loading        = useSelector(selectAddressLoading);
    const error          = useSelector(selectAddressError);

    const [modalOpen,   setModalOpen]   = useState(false);
    const [editAddress, setEditAddress] = useState(null);
    const [deletingId,  setDeletingId]  = useState(null);

    useEffect(() => {
      dispatch(fetchAddresses());
      return () => dispatch(clearAddressErrors());
    }, [dispatch]);

    const openAdd    = () => { setEditAddress(null); setModalOpen(true); dispatch(clearAddressErrors()); };
    const openEdit   = (a) => { setEditAddress(a);   setModalOpen(true); dispatch(clearAddressErrors()); };
    const closeModal = () => { setModalOpen(false);  setEditAddress(null); };

    const handleSubmit = async (formData) => {
      try {
        if (editAddress) {
          await dispatch(updateAddress({ id: editAddress._id, ...formData })).unwrap();
          toast.success("Address updated!", { theme: "dark" });
        } else {          
          await dispatch(addAddress(formData)).unwrap();
          toast.success("Address added!", { theme: "dark" });
        }
        closeModal();
      } catch (e) {
        toast.error(e?.message || "Failed to save address", { theme: "dark" });
      }
    };

    const handleDelete = async (id) => {
      if (!window.confirm("Delete this address?")) return;
      setDeletingId(id);
      try {
        await dispatch(deleteAddress(id)).unwrap();
        toast.success("Address removed", { theme: "dark" });
      } catch (e) {
        toast.error(e?.message || "Failed to delete", { theme: "dark" });
      } finally {
        setDeletingId(null); }
    };

    const handleSetDefault = async (addr) => {
      try {
        await dispatch(updateAddress({ id: addr._id, isDefault: true })).unwrap();
        toast.success("Default address updated", { theme: "dark" });
      } catch (e) {
        toast.error(e?.message || "Failed to set default", { theme: "dark" });
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
            className="bg-black text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer hover:bg-[#F7A221] hover:text-black"
          >
            <Plus size={16} /> Add
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
            <button onClick={openAdd} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer">
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

// /**
//  * UserAddress.jsx — Production Grade (9.5/10 Plan)
//  *
//  * ─── What's implemented ────────────────────────────────────────────────────
//  * Phase 1 — Request-level async safety
//  *   • Every GPS + geocode request gets a unique requestId (crypto.randomUUID)
//  *   • On modal close → AbortController aborts all pending fetch calls instantly
//  *   • Stale requestId responses are silently discarded (no ghost fills)
//  *   • Double-tap "Use Location" is safe — old request is killed first
//  *
//  * Phase 2 — Address normalization + confidence scoring
//  *   • normalizeMapboxAddress() maps Mapbox's inconsistent Indian context fields
//  *     to our clean internal schema: area, city, state, postalCode, addressLine1
//  *   • confidenceScore() returns 0–100 based on how many key fields resolved
//  *   • Low-confidence addresses (<60) show a subtle amber warning banner
//  *   • Auto-filled fields get a green "auto" badge — disappears on edit
//  *
//  * Phase 3 — Wrong location guard
//  *   • If confidence < 60 at Step 3 → subtle "Please verify street/house"
//  *     nudge above Save button (non-blocking, just nudging)
//  *
//  * Phase 4 — Cold start performance
//  *   • Modal opens instantly — no waiting for GPS or Mapbox
//  *   • Mapbox bundle is dynamic imported ONLY when user clicks "Use My Location"
//  *     and GPS resolves — never before
//  *   • Map skeleton loader shown while Mapbox initializes
//  *
//  * Phase 5 — Kill GPS when user is faster
//  *   • Track filledFieldCount — if user fills 3+ address fields manually
//  *     while GPS is still pending, the GPS request is aborted immediately
//  *   • No flicker, no overwriting user's own data
//  *
//  * Phase 6 — Address correction rate metric
//  *   • sessionStorage tracks "address_autofill_used"
//  *   • On save, logs { source, confidence, fieldsEdited } to console
//  *     Replace console.info with your real analytics (Mixpanel, PostHog, etc.)
//  *
//  * Phase 7 — Permission memory (real browser API)
//  *   • navigator.permissions.query checks real permission state — no localStorage
//  *   • If denied → "Use My Location" button hidden, pincode-first UX shown
//  *   • Live permission change listener → button reappears if user grants later
//  *
//  * ─── Pre-existing features (all preserved) ─────────────────────────────────
//  *   • Step 1: Full Name + Phone only
//  *   • Step 2: "Use My Location" + map inline + manual address fields
//  *   • Step 3: Address type, delivery instructions, toggles
//  *   • Eye button on map → flyTo current GPS pin at zoom 17
//  *   • Map view dropdown (Satellite default, Streets, Traffic, Outdoors)
//  *   • Draggable marker + tap-to-reposition
//  *   • India-specific reverse-geocode parser (Mapbox context IDs)
//  *   • Pincode → city/state via postalpincode.in (free, no key)
//  *   • Redux: fetch, add, update, delete, setDefault — all preserved
//  *   • Modal: slides up from bottom on mobile, centered on sm+
//  *   • Body scroll lock on modal open
//  *   • Mapbox CSS injected once at runtime (avoids Vite issues)
//  *   • 100% responsive — 360px mobile → desktop
//  */

// import React, {
//   useEffect, useState, useCallback, useRef, useMemo,
// } from "react";
// import { createPortal } from "react-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { toast } from "react-toastify";
// import {
//   MapPin, Plus, Home, Briefcase, Star, Pencil, Trash2,
//   X, RefreshCw, AlertCircle, ChevronRight, ChevronLeft,
//   Navigation, CheckCircle2, Loader2, AlertTriangle, Move,
//   Eye, Layers, ShieldAlert,
// } from "lucide-react";

// import {
//   fetchAddresses, addAddress, updateAddress, deleteAddress,
//   clearAddressErrors, selectDefaultAddress, selectOtherAddresses,
//   selectAddressLoading, selectAddressError,
// } from "../../../components/REDUX_FEATURES/REDUX_SLICES/Useraddressslice";

// // ─────────────────────────────────────────────────────────────────────────────
// // CONSTANTS
// // ─────────────────────────────────────────────────────────────────────────────

// // .env: VITE_MAPBOX_TOKEN=pk.eyJ1... (no quotes, no semicolon)
// const MAPBOX_TOKEN =
//   import.meta.env.VITE_MAPBOX_TOKEN

// // Map view options — index 0 is the default (Satellite)
// const MAP_STYLES = [
//   { label: "Satellite", value: "mapbox://styles/mapbox/satellite-streets-v12" },
//   { label: "Streets",   value: "mapbox://styles/mapbox/streets-v12"           },
//   { label: "Traffic",   value: "mapbox://styles/mapbox/traffic-day-v2"        },
//   { label: "Outdoors",  value: "mapbox://styles/mapbox/outdoors-v12"          },
// ];

// // Blank form — all fields
// const EMPTY_FORM = {
//   fullName: "", phone: "", houseNumber: "", area: "",
//   landmark: "", addressLine1: "", addressLine2: "",
//   city: "", state: "", postalCode: "", country: "India",
//   addressType: "home", isDefault: false,
//   isGift: false, deliveryInstructions: "",
// };

// // Address type → icon
// const ADDRESS_TYPE_ICON = {
//   home:  <Home      size={15} className="text-[#F7A221]" />,
//   work:  <Briefcase size={15} className="text-blue-500"  />,
//   other: <MapPin    size={15} className="text-gray-400"  />,
// };

// // Map UI state machine
// const MAP = { IDLE: "idle", LOCATING: "locating", OPEN: "open" };

// // Fields counted toward "user is typing manually" (Phase 5)
// const MANUAL_FIELDS = ["houseNumber", "area", "city", "state", "postalCode", "addressLine1"];

// // ─────────────────────────────────────────────────────────────────────────────
// // PHASE 2 — Address normalization + confidence scoring
// // ─────────────────────────────────────────────────────────────────────────────

// /**
//  * normalizeMapboxAddress
//  * Maps Mapbox's inconsistent Indian geocoding context to our clean schema.
//  *
//  * Mapbox context IDs for India:
//  *   neighborhood.xxx → sub-area (Connaught Place, Bandra West)
//  *   locality.xxx     → locality  (Andheri East, Vasant Kunj)
//  *   place.xxx        → city / district (Delhi, Mumbai, Gurugram)
//  *   region.xxx       → state (Delhi, Maharashtra)
//  *   postcode.xxx     → 6-digit pincode
//  *   country.xxx      → India
//  */
// const normalizeMapboxAddress = (geoJson) => {
//   const feature = geoJson?.features?.[0];
//   if (!feature) return null;

//   const ctx = feature.context || [];

//   // Safe getter — finds first context entry whose id starts with prefix
//   const get = (prefix) =>
//     ctx.find((c) => c.id?.startsWith(prefix))?.text?.trim() || "";

//   // First comma segment of place_name is usually the street / POI name
//   const firstSegment = feature.place_name?.split(",")[0]?.trim() || "";

//   // Area: prefer locality (more specific), then neighborhood, then place
//   const area =
//     get("locality") ||
//     get("neighborhood") ||
//     get("place") ||
//     "";

//   // City: prefer place (district/city), fallback to locality
//   const city       = get("place") || get("locality") || "";
//   const state      = get("region");
//   const postalCode = get("postcode");

//   return { addressLine1: firstSegment, area, city, state, postalCode };
// };

// /**
//  * confidenceScore — returns 0–100
//  * Lower score = more likely to be wrong / incomplete address.
//  * Used for Phase 2 warning and Phase 3 save nudge.
//  */
// const confidenceScore = (parsed) => {
//   if (!parsed) return 0;
//   let score = 0;
//   if (parsed.city?.trim())         score += 30; // most important
//   if (parsed.state?.trim())        score += 20;
//   if (parsed.postalCode?.trim())   score += 25;
//   if (parsed.area?.trim())         score += 15;
//   if (parsed.addressLine1?.trim()) score += 10;
//   return score;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // PHASE 6 — Analytics hook
// // Replace console.info with Mixpanel / PostHog / your analytics here
// // ─────────────────────────────────────────────────────────────────────────────
// const trackAddressSave = ({ source, confidence, fieldsEdited }) => {
//   if (source === "gps") {
//     try { sessionStorage.setItem("address_autofill_used", "true"); } catch { /* ignore */ }
//   }
//   // ← swap this with your real analytics call
//   console.info("[Address Analytics]", { source, confidence, fieldsEdited });
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // FREE INDIAN PINCODE API
// // ─────────────────────────────────────────────────────────────────────────────
// const fetchByPincode = async (pin, signal) => {
//   if (!/^\d{6}$/.test(pin)) return null;
//   try {
//     const res  = await fetch(
//       `https://api.postalpincode.in/pincode/${pin}`,
//       signal ? { signal } : {}
//     );
//     const json = await res.json();
//     if (json?.[0]?.Status === "Success") {
//       const po = json[0].PostOffice?.[0];
//       return { city: po?.District || "", state: po?.State || "" };
//     }
//   } catch { /* silent — aborted or network error */ }
//   return null;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // INJECT MAPBOX CSS ONCE
// // Runtime <link> injection avoids Vite CSS import issues and SSR problems.
// // ─────────────────────────────────────────────────────────────────────────────
// let mapboxCssInjected = false;
// const injectMapboxCss = () => {
//   if (mapboxCssInjected) return;
//   const link = document.createElement("link");
//   link.rel   = "stylesheet";
//   link.href  = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
//   document.head.appendChild(link);
//   mapboxCssInjected = true;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // GENERATE UNIQUE REQUEST ID (Phase 1)
// // ─────────────────────────────────────────────────────────────────────────────
// const newRequestId = () =>
//   typeof crypto !== "undefined" && crypto.randomUUID
//     ? crypto.randomUUID()
//     : Math.random().toString(36).slice(2);

// // ─────────────────────────────────────────────────────────────────────────────
// // MapPicker
// // ─────────────────────────────────────────────────────────────────────────────
// /**
//  * Props:
//  *   coords         — { lat, lng } initial GPS position
//  *   accuracyMeters — GPS horizontal accuracy in meters
//  *   abortSignal    — AbortSignal from parent AbortController (Phase 1)
//  *   onConfirm      — (parsedAddress, confidenceScore) => void
//  *   onCancel       — () => void
//  */
// const MapPicker = ({ coords, accuracyMeters, abortSignal, onConfirm, onCancel }) => {
//   const containerRef = useRef(null);
//   const mapRef       = useRef(null);
//   const markerRef    = useRef(null);

//   const [lngLat,      setLngLat]      = useState({ lng: coords.lng, lat: coords.lat });
//   const [detected,    setDetected]    = useState(null);
//   const [confidence,  setConfidence]  = useState(0);
//   const [reversing,   setReversing]   = useState(false);
//   const [activeStyle, setActiveStyle] = useState(MAP_STYLES[0].value); // Satellite default
//   const [styleOpen,   setStyleOpen]   = useState(false);
//   const [mapLoaded,   setMapLoaded]   = useState(false);

//   // ── Phase 1: reverse geocode with per-call AbortController ───────────────
//   const reverseGeocode = useCallback(async ({ lng, lat }) => {
//     const ctrl = new AbortController();
//     // If parent (modal) aborts → propagate to this request too
//     abortSignal?.addEventListener("abort", () => ctrl.abort(), { once: true });

//     setReversing(true);
//     try {
//       const url =
//         `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
//         `?access_token=${MAPBOX_TOKEN}&country=IN&language=en` +
//         `&types=address,place,neighborhood,locality,postcode`;

//       const res    = await fetch(url, { signal: ctrl.signal });
//       const data   = await res.json();
//       const parsed = normalizeMapboxAddress(data);
//       const score  = confidenceScore(parsed);
//       setDetected(parsed);
//       setConfidence(score);
//     } catch (e) {
//       // AbortError is expected on fast pin moves — don't wipe existing result
//       if (e?.name !== "AbortError") setDetected(null);
//     } finally {
//       setReversing(false);
//     }
//   }, [abortSignal]);

//   // ── Phase 4: Mount Mapbox once via dynamic import ─────────────────────────
//   // Mapbox GL JS (~350KB) only loads after user clicks "Use My Location"
//   // and GPS resolves — never on page load.
//   useEffect(() => {
//     import("mapbox-gl").then((mod) => {
//       if (abortSignal?.aborted) return; // modal already closed before import resolved
//       if (!containerRef.current) return;

//       const mbgl = mod.default || mod;
//       mbgl.accessToken = MAPBOX_TOKEN;

//       const map = new mbgl.Map({
//         container:          containerRef.current,
//         style:              MAP_STYLES[0].value, // Satellite default
//         center:             [coords.lng, coords.lat],
//         zoom:               16,
//         attributionControl: false,
//       });

//       // Built-in zoom + compass controls (top-right — away from our custom buttons)
//       map.addControl(new mbgl.NavigationControl({ showCompass: true }), "top-right");
//       map.addControl(new mbgl.AttributionControl({ compact: true }), "bottom-right");

//       // Orange draggable marker
//       const marker = new mbgl.Marker({ color: "#F7A221", draggable: true })
//         .setLngLat([coords.lng, coords.lat])
//         .addTo(map);

//       // Drag ends → update coords + reverse geocode new position
//       marker.on("dragend", () => {
//         const pos  = marker.getLngLat();
//         const next = { lng: pos.lng, lat: pos.lat };
//         setLngLat(next);
//         reverseGeocode(next);
//       });

//       // Tap / click on map → teleport marker + reverse geocode
//       map.on("click", (e) => {
//         const next = { lng: e.lngLat.lng, lat: e.lngLat.lat };
//         marker.setLngLat([next.lng, next.lat]);
//         setLngLat(next);
//         reverseGeocode(next);
//       });

//       // CRITICAL: resize after browser paint — modal slide-in animation may
//       // delay the container reaching its final computed dimensions
//       map.on("load", () => {
//         map.resize();
//         setMapLoaded(true);
//       });
//       requestAnimationFrame(() => map.resize());

//       mapRef.current    = map;
//       markerRef.current = marker;

//       // Initial reverse geocode for the GPS drop point
//       reverseGeocode({ lng: coords.lng, lat: coords.lat });
//     });

//     // Cleanup on unmount — prevents memory leak and WebGL context exhaustion
//     return () => {
//       mapRef.current?.remove();
//       mapRef.current    = null;
//       markerRef.current = null;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // intentional — mount once only

//   // ── Style switcher ────────────────────────────────────────────────────────
//   // setStyle() wipes all layers including the marker, so we re-add it
//   // after the new style finishes loading via map.once("styledata")
//   const handleStyleChange = (styleUrl) => {
//     setActiveStyle(styleUrl);
//     setStyleOpen(false);
//     if (!mapRef.current) return;

//     const savedPos = markerRef.current?.getLngLat();
//     mapRef.current.setStyle(styleUrl);

//     mapRef.current.once("styledata", () => {
//       if (markerRef.current && savedPos) {
//         markerRef.current.setLngLat(savedPos).addTo(mapRef.current);
//       }
//     });
//   };

//   // ── Eye / locate me — fly camera back to current GPS pin ─────────────────
//   const handleLocateMe = () => {
//     if (!mapRef.current) return;
//     mapRef.current.flyTo({
//       center: [lngLat.lng, lngLat.lat],
//       zoom:   17, speed: 1.4, curve: 1, essential: true,
//     });
//   };

//   const lowAccuracy   = accuracyMeters > 500;
//   const lowConfidence = confidence < 60 && detected !== null;
//   const activeLabel   = MAP_STYLES.find((s) => s.value === activeStyle)?.label || "Satellite";

//   return (
//     <div className="flex flex-col gap-3 w-full">

//       {/* ── Phase 2: Low GPS accuracy warning ─────────────────────────────── */}
//       {lowAccuracy && (
//         <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
//           <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
//           <p className="text-[10px] sm:text-[11px] font-bold text-amber-700 leading-snug">
//             GPS accuracy ~{Math.round(accuracyMeters)}m — using Wi-Fi / cell towers.
//             <strong className="block mt-0.5">Drag the pin to your exact spot.</strong>
//           </p>
//         </div>
//       )}

//       {/* ── Map container — FIXED pixel height, required by Mapbox ──────── */}
//       <div
//         className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-gray-100 w-full"
//         style={{ height: "260px" }}
//       >
//         {/* Phase 4: Skeleton while Mapbox loads */}
//         {!mapLoaded && (
//           <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-[5]">
//             <Loader2 size={22} className="text-gray-300 animate-spin" />
//           </div>
//         )}

//         {/* Map canvas — Mapbox mounts into this div */}
//         <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

//         {/* Eye button — top-left — flies to current GPS pin at zoom 17 */}
//         <button
//           onClick={handleLocateMe}
//           title="Fly to my location"
//           className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm shadow-lg rounded-xl p-2 sm:p-2.5 hover:bg-[#F7A221] transition-all cursor-pointer border border-gray-100 group"
//         >
//           <Eye size={14} className="text-gray-700 group-hover:text-white transition-colors" />
//         </button>

//         {/* Map view dropdown — below eye button, top-left */}
//         <div className="absolute top-12 left-3 z-10 sm:top-[52px]">
//           {/* Trigger */}
//           <button
//             onClick={() => setStyleOpen((o) => !o)}
//             className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm shadow-lg rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer border border-gray-100"
//           >
//             <Layers size={11} />
//             <span>{activeLabel}</span>
//           </button>

//           {/* Options */}
//           {styleOpen && (
//             <div className="mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[120px]">
//               {MAP_STYLES.map((s) => (
//                 <button
//                   key={s.value}
//                   onClick={() => handleStyleChange(s.value)}
//                   className={`w-full text-left px-3 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
//                     activeStyle === s.value
//                       ? "bg-black text-white"
//                       : "text-gray-600 hover:bg-gray-50"
//                   }`}
//                 >
//                   {s.label}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Drag hint pill — bottom center */}
//         <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none whitespace-nowrap z-10">
//           <Move size={10} className="text-[#F7A221]" /> Drag pin · Tap to move
//         </div>
//       </div>

//       {/* ── Phase 2: Detected address preview ────────────────────────────── */}
//       <div className="bg-gray-50 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-start gap-3 min-h-[52px]">
//         {reversing ? (
//           <>
//             <Loader2 size={13} className="text-gray-400 animate-spin flex-shrink-0 mt-0.5" />
//             <span className="text-xs font-bold text-gray-400">Detecting address…</span>
//           </>
//         ) : detected ? (
//           <>
//             <CheckCircle2 size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
//             <div className="flex-1 min-w-0">
//               <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-green-600 mb-0.5 flex items-center gap-1.5">
//                 Detected
//                 {/* Dev-only confidence score — remove in production */}
//                 {import.meta.env.DEV && (
//                   <span className="text-gray-400 normal-case tracking-normal font-bold text-[9px]">
//                     ({confidence}% confidence)
//                   </span>
//                 )}
//               </p>
//               <p className="text-xs sm:text-sm font-bold text-gray-700 leading-relaxed">
//                 {[detected.addressLine1, detected.area, detected.city, detected.state, detected.postalCode]
//                   .filter(Boolean).join(", ")}
//               </p>
//             </div>
//           </>
//         ) : (
//           <>
//             <AlertCircle size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
//             <span className="text-xs font-bold text-gray-400">
//               Could not detect address — drag the pin to your spot.
//             </span>
//           </>
//         )}
//       </div>

//       {/* ── Phase 2: Low confidence warning ──────────────────────────────── */}
//       {lowConfidence && (
//         <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
//           <ShieldAlert size={13} className="text-orange-500 flex-shrink-0 mt-0.5" />
//           <p className="text-[10px] sm:text-[11px] font-bold text-orange-700 leading-snug">
//             Address looks incomplete — city or pincode may be missing.
//             Drag the pin closer to your exact location.
//           </p>
//         </div>
//       )}

//       {/* ── Map action buttons ────────────────────────────────────────────── */}
//       <div className="flex gap-2 sm:gap-3">
//         <button
//           onClick={onCancel}
//           className="px-4 sm:px-5 py-3.5 rounded-2xl border-2 border-gray-200 font-black text-[10px] uppercase tracking-widest hover:border-black transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
//         >
//           <ChevronLeft size={14} />
//         </button>

//         <button
//           onClick={() => onConfirm(detected, confidence)}
//           disabled={!detected || reversing}
//           className="flex-1 py-3.5 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
//         >
//           <CheckCircle2 size={13} />
//           {reversing ? "Detecting…" : "Use This Location"}
//         </button>
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Field — reusable labeled input with optional "auto" badge
// // ─────────────────────────────────────────────────────────────────────────────
// const Field = ({
//   label, name, value, onChange, onBlur,
//   required, type = "text", placeholder, maxLength, suffix, autoFilled,
// }) => (
//   <div className="flex flex-col gap-1.5 w-full">
//     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-1.5">
//       {label}
//       {required   && <span className="text-red-400">*</span>}
//       {/* Phase 2: green "auto" badge on GPS-filled fields — disappears on edit */}
//       {autoFilled && (
//         <span className="text-[8px] font-black uppercase tracking-widest text-green-500 bg-green-50 px-1.5 py-0.5 rounded-full">
//           auto
//         </span>
//       )}
//     </label>
//     <div className="relative">
//       <input
//         type={type} name={name} value={value}
//         onChange={onChange} onBlur={onBlur}
//         placeholder={placeholder} maxLength={maxLength}
//         className={`bg-gray-50 border-2 focus:bg-white rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm font-bold outline-none transition-all w-full cursor-pointer focus:cursor-text ${
//           autoFilled
//             ? "border-green-200 focus:border-green-400"
//             : "border-transparent focus:border-black"
//         }`}
//       />
//       {suffix && <div className="absolute right-4 top-1/2 -translate-y-1/2">{suffix}</div>}
//     </div>
//   </div>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // AddressFormModal
// // ─────────────────────────────────────────────────────────────────────────────
// const AddressFormModal = ({ initial, onSubmit, onClose, isSaving, error }) => {
//   const [form,      setForm]      = useState(initial || EMPTY_FORM);
//   const [step,      setStep]      = useState(1);
//   const [formError, setFormError] = useState(null);

//   // Phase 2 — which fields were GPS-filled (shown with green "auto" badge)
//   const [autoFilledFields,      setAutoFilledFields]      = useState(new Set());

//   // Phase 6 — track source + edits for analytics
//   const [addressSource,         setAddressSource]         = useState("manual");
//   const [gpsConfidence,         setGpsConfidence]         = useState(0);
//   const [fieldsEditedAfterGps,  setFieldsEditedAfterGps]  = useState(0);

//   // Map state
//   const [mapStatus,      setMapStatus]      = useState(MAP.IDLE);
//   const [gpsCoords,      setGpsCoords]      = useState(null);
//   const [gpsAccuracy,    setGpsAccuracy]    = useState(0);
//   const [locationErr,    setLocationErr]    = useState(null);
//   const [pincodeLoading, setPincodeLoading] = useState(false);

//   // Phase 7 — real browser permission state ("unknown"|"granted"|"denied"|"prompt")
//   const [locationPermission, setLocationPermission] = useState("unknown");

//   // Phase 1 — master AbortController for this modal session
//   const abortCtrlRef = useRef(new AbortController());
//   // Active GPS requestId — stale responses are discarded
//   const activeReqRef = useRef(null);

//   // Phase 5 — count how many address fields user has filled manually
//   const filledManualCount = useMemo(
//     () => MANUAL_FIELDS.filter((f) => form[f]?.trim().length > 0).length,
//     [form]
//   );

//   // ── On mount: inject CSS, lock scroll, check real permission state ────────
//   useEffect(() => {
//     injectMapboxCss();

//     // Lock body scroll
//     const sw = window.innerWidth - document.documentElement.clientWidth;
//     document.body.style.overflow     = "hidden";
//     document.body.style.paddingRight = `${sw}px`;

//     // Phase 7 — check real browser permission, no localStorage hacks
//     if (navigator.permissions) {
//       navigator.permissions.query({ name: "geolocation" })
//         .then((status) => {
//           setLocationPermission(status.state);
//           // Live change listener — if user grants after deny, button reappears
//           status.onchange = () => setLocationPermission(status.state);
//         })
//         .catch(() => setLocationPermission("unknown"));
//     }

//     return () => {
//       // Phase 1 — abort ALL pending requests when modal closes
//       abortCtrlRef.current.abort();
//       document.body.style.overflow     = "unset";
//       document.body.style.paddingRight = "0px";
//     };
//   }, []);

//   // ── Phase 5 — kill GPS if user has filled 3+ fields manually ─────────────
//   useEffect(() => {
//     if (filledManualCount >= 3 && mapStatus === MAP.LOCATING) {
//       abortCtrlRef.current.abort();
//       abortCtrlRef.current = new AbortController(); // fresh for future requests
//       activeReqRef.current = null;
//       setMapStatus(MAP.IDLE);
//     }
//   }, [filledManualCount, mapStatus]);

//   // ── Input change handler ──────────────────────────────────────────────────
//   const handleChange = useCallback((e) => {
//     const { name, value } = e.target;

//     // Phone: digits only, max 10 chars
//     if (name === "phone") {
//       const v = value.replace(/\D/g, "");
//       if (v.length <= 10) setForm((p) => ({ ...p, phone: v }));
//       return;
//     }

//     setForm((p) => ({ ...p, [name]: value }));

//     // Phase 6 — count edits to GPS-filled fields for analytics
//     if (addressSource === "gps" && autoFilledFields.has(name)) {
//       setFieldsEditedAfterGps((n) => n + 1);
//       // Phase 2 — remove "auto" badge once user edits this field
//       setAutoFilledFields((prev) => {
//         const next = new Set(prev);
//         next.delete(name);
//         return next;
//       });
//     }
//   }, [addressSource, autoFilledFields]);

//   // ── Pincode blur → auto-fill city/state via free API ─────────────────────
//   const handlePincodeBlur = async (e) => {
//     const pin = e.target.value;
//     if (pin.length !== 6) return;
//     setPincodeLoading(true);
//     const result = await fetchByPincode(pin, abortCtrlRef.current.signal);
//     if (result) {
//       setForm((p) => ({
//         ...p,
//         city:  p.city  || result.city,
//         state: p.state || result.state,
//       }));
//     }
//     setPincodeLoading(false);
//   };

//   // ── Phase 1 + 7 — Use My Location ────────────────────────────────────────
//   const handleUseLocation = () => {
//     // Phase 7 — respect browser deny — don't even call geolocation
//     if (locationPermission === "denied") {
//       setLocationErr("Location access denied. Enable it in browser settings.");
//       return;
//     }

//     if (!navigator.geolocation) {
//       setLocationErr("Geolocation is not supported by this browser.");
//       return;
//     }

//     setLocationErr(null);

//     // Phase 1 — abort any previous in-flight GPS request first
//     abortCtrlRef.current.abort();
//     abortCtrlRef.current = new AbortController();
//     const reqId = newRequestId();
//     activeReqRef.current = reqId;

//     setMapStatus(MAP.LOCATING);

//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         // Phase 1 — discard if a newer request has taken over
//         if (activeReqRef.current !== reqId) return;
//         setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
//         setGpsAccuracy(pos.coords.accuracy || 0);
//         setMapStatus(MAP.OPEN);
//       },
//       (err) => {
//         if (activeReqRef.current !== reqId) return;
//         setMapStatus(MAP.IDLE);
//         activeReqRef.current = null;

//         // Phase 7 — update permission state on explicit deny
//         if (err.code === 1) setLocationPermission("denied");

//         const msg =
//           err.code === 1 ? "Location access denied. Enable it in browser settings." :
//           err.code === 2 ? "Location unavailable. Check your device settings."       :
//                            "Location request timed out. Please try again.";
//         setLocationErr(msg);
//       },
//       { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
//     );
//   };

//   // ── Map confirm — fills form with GPS data, marks auto-filled fields ──────
//   const handleMapConfirm = (parsed, score) => {
//     if (!parsed) return;

//     const filled = new Set();
//     const patch  = {};

//     // Only fill fields that are currently empty — never overwrite user's input
//     const tryFill = (key, value) => {
//       if (value?.trim() && !form[key]?.trim()) {
//         patch[key] = value;
//         filled.add(key);
//       }
//     };

//     tryFill("area",         parsed.area);
//     tryFill("addressLine1", parsed.addressLine1);
//     tryFill("city",         parsed.city);
//     tryFill("state",        parsed.state);
//     tryFill("postalCode",   parsed.postalCode);

//     setForm((p) => ({ ...p, ...patch }));
//     setAutoFilledFields(filled);
//     setAddressSource("gps");
//     setGpsConfidence(score);
//     setMapStatus(MAP.IDLE);

//     toast.success("Location detected! Review and fill your house number.", { theme: "dark" });
//   };

//   // ── Helpers ───────────────────────────────────────────────────────────────
//   const toggleBoolean = (key) => setForm((p) => ({ ...p, [key]: !p[key] }));
//   const setType       = (t)   => setForm((p) => ({ ...p, addressType: t }));

//   // ── Step validation ───────────────────────────────────────────────────────
//   const validateStep = (s) => {
//     setFormError(null);
//     if (s === 1) {
//       if (!form.fullName.trim())    return "Full Name is required";
//       if (form.phone.length !== 10) return "Phone must be exactly 10 digits";
//     }
//     if (s === 2) {
//       const required = ["houseNumber", "area", "city", "state", "postalCode"];
//       for (const f of required) {
//         if (!form[f]?.trim())
//           return `${f.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())} is required`;
//       }
//       if (!/^\d{6}$/.test(form.postalCode)) return "Postal code must be 6 digits";
//     }
//     return null;
//   };

//   const handleNext = () => {
//     const err = validateStep(step);
//     if (err) setFormError(err);
//     else { setFormError(null); setStep(step + 1); }
//   };

//   // ── Final submit ──────────────────────────────────────────────────────────
//   const handleFinalSubmit = (e) => {
//     e.preventDefault();
//     const err = validateStep(step);
//     if (err) { setFormError(err); return; }

//     // Phase 6 — fire analytics before dispatching save
//     trackAddressSave({
//       source:       addressSource,
//       confidence:   gpsConfidence,
//       fieldsEdited: fieldsEditedAfterGps,
//     });

//     const data = { ...form };
//     Object.keys(data).forEach((k) => { if (data[k] === "") data[k] = null; });
//     onSubmit(data);
//   };

//   const isMapOpen = mapStatus === MAP.OPEN;

//   // Phase 3 — non-blocking nudge on Step 3 if GPS confidence was low
//   const showVerifyNudge = step === 3 && addressSource === "gps" && gpsConfidence < 60;

//   // Phase 7 — hide location button if permission is explicitly denied
//   const showLocationButton = locationPermission !== "denied";

//   return createPortal(
//     <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center sm:p-4">
//       {/* Backdrop — click to close (locked when map is open) */}
//       <div
//         className="absolute inset-0 bg-black/60 backdrop-blur-sm"
//         onClick={isMapOpen ? undefined : onClose}
//       />

//       {/* Modal card — slides up from bottom on mobile, centered on sm+ */}
//       <div className="relative bg-white rounded-t-[32px] sm:rounded-[40px] w-full sm:max-w-xl shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden">

//         {/* ── Header: progress dots + close button ──────────────────────── */}
//         <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-3 sm:pb-4 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
//           <div className="flex items-center gap-2">
//             {[1, 2, 3].map((s) => (
//               <div
//                 key={s}
//                 className={`h-1.5 rounded-full transition-all duration-500 ${
//                   step >= s ? "bg-black w-6 sm:w-8" : "bg-gray-100 w-4 sm:w-5"
//                 }`}
//               />
//             ))}
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
//           >
//             <X size={18} />
//           </button>
//         </div>

//         {/* ── Scrollable body ────────────────────────────────────────────── */}
//         <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 sm:py-6">

//           {/* Page title — hidden when map is open */}
//           {!isMapOpen && (
//             <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-5">
//               {step === 1 && "Who's receiving this?"}
//               {step === 2 && "Where should we deliver?"}
//               {step === 3 && "Final preferences"}
//             </h2>
//           )}

//           {/* ══════════════════════════════════════════════════════════════ */}
//           {/* STEP 1 — Full Name + Phone only                               */}
//           {/* ══════════════════════════════════════════════════════════════ */}
//           {step === 1 && (
//             <div className="space-y-4 sm:space-y-5">
//               <Field
//                 label="Full Name" name="fullName"
//                 value={form.fullName} onChange={handleChange}
//                 required placeholder="Ravi Kumar"
//               />
//               <Field
//                 label="Phone Number" name="phone"
//                 value={form.phone} onChange={handleChange}
//                 required type="tel" placeholder="10-digit number"
//               />
//             </div>
//           )}

//           {/* ══════════════════════════════════════════════════════════════ */}
//           {/* STEP 2 — Location button + Map + Manual address fields        */}
//           {/* ══════════════════════════════════════════════════════════════ */}
//           {step === 2 && (
//             <div className="space-y-4 sm:space-y-5">

//               {/* Phase 7 — Location button hidden when permission denied */}
//               {!isMapOpen && showLocationButton && (
//                 <button
//                   onClick={handleUseLocation}
//                   disabled={mapStatus === MAP.LOCATING}
//                   className="w-full py-3.5 sm:py-4 border-2 border-dashed border-gray-200 hover:border-[#F7A221] rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] sm:text-[11px] uppercase tracking-widest text-gray-500 hover:text-black transition-all cursor-pointer disabled:opacity-50 group"
//                 >
//                   {mapStatus === MAP.LOCATING ? (
//                     <>
//                       <Loader2 size={13} className="animate-spin text-[#F7A221]" />
//                       Getting your location…
//                     </>
//                   ) : (
//                     <>
//                       <Navigation size={13} className="text-[#F7A221] group-hover:scale-110 transition-transform" />
//                       Use my current location
//                     </>
//                   )}
//                 </button>
//               )}

//               {/* Phase 7 — Pincode-first fallback when permission denied */}
//               {locationPermission === "denied" && !isMapOpen && (
//                 <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
//                   <AlertCircle size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
//                   <p className="text-[10px] sm:text-[11px] font-bold text-blue-700 leading-snug">
//                     Location access is off. Enter your pincode below — we'll fill city &amp; state automatically.
//                   </p>
//                 </div>
//               )}

//               {/* GPS / location error */}
//               {locationErr && !isMapOpen && (
//                 <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
//                   <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
//                   <p className="text-[10px] sm:text-[11px] font-bold text-red-700">{locationErr}</p>
//                 </div>
//               )}

//               {/* Phase 1 — MapPicker receives abortSignal so it dies with modal */}
//               {isMapOpen && (
//                 <MapPicker
//                   coords={gpsCoords}
//                   accuracyMeters={gpsAccuracy}
//                   abortSignal={abortCtrlRef.current.signal}
//                   onConfirm={handleMapConfirm}
//                   onCancel={() => setMapStatus(MAP.IDLE)}
//                 />
//               )}

//               {/* Divider */}
//               {!isMapOpen && (
//                 <div className="flex items-center gap-3">
//                   <div className="flex-1 h-px bg-gray-100" />
//                   <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">
//                     or fill manually
//                   </span>
//                   <div className="flex-1 h-px bg-gray-100" />
//                 </div>
//               )}

//               {/* Phase 2 — Auto-fill banner (only when fields were filled from GPS) */}
//               {!isMapOpen && autoFilledFields.size > 0 && (
//                 <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-2xl px-3 sm:px-4 py-2.5">
//                   <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
//                   <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-green-700">
//                     Fields auto-filled — please verify before saving
//                   </p>
//                 </div>
//               )}

//               {/* Manual address fields — hidden while map is open */}
//               {!isMapOpen && (
//                 <>
//                   <div className="grid grid-cols-2 gap-3 sm:gap-4">
//                     <Field
//                       label="House / Flat No." name="houseNumber"
//                       value={form.houseNumber} onChange={handleChange}
//                       required placeholder="42B"
//                       autoFilled={autoFilledFields.has("houseNumber")}
//                     />
//                     <Field
//                       label="Area / Sector" name="area"
//                       value={form.area} onChange={handleChange}
//                       required placeholder="Sector 12"
//                       autoFilled={autoFilledFields.has("area")}
//                     />
//                   </div>
//                   <Field
//                     label="Landmark" name="landmark"
//                     value={form.landmark} onChange={handleChange}
//                     placeholder="Near City Mall"
//                   />
//                   <Field
//                     label="Address Line 1" name="addressLine1"
//                     value={form.addressLine1} onChange={handleChange}
//                     placeholder="Building name, floor…"
//                     autoFilled={autoFilledFields.has("addressLine1")}
//                   />
//                   <Field
//                     label="Address Line 2" name="addressLine2"
//                     value={form.addressLine2} onChange={handleChange}
//                     placeholder="Additional info"
//                   />
//                   <div className="grid grid-cols-2 gap-3 sm:gap-4">
//                     <Field
//                       label="City" name="city"
//                       value={form.city} onChange={handleChange}
//                       required placeholder="Mumbai"
//                       autoFilled={autoFilledFields.has("city")}
//                     />
//                     <Field
//                       label="Pincode" name="postalCode"
//                       value={form.postalCode}
//                       onChange={handleChange} onBlur={handlePincodeBlur}
//                       required placeholder="400001" maxLength={6}
//                       autoFilled={autoFilledFields.has("postalCode")}
//                       suffix={
//                         pincodeLoading
//                           ? <Loader2 size={12} className="text-gray-400 animate-spin" />
//                           : null
//                       }
//                     />
//                   </div>
//                   <Field
//                     label="State" name="state"
//                     value={form.state} onChange={handleChange}
//                     required placeholder="Maharashtra"
//                     autoFilled={autoFilledFields.has("state")}
//                   />
//                 </>
//               )}
//             </div>
//           )}

//           {/* ══════════════════════════════════════════════════════════════ */}
//           {/* STEP 3 — Address type, delivery instructions, toggles         */}
//           {/* ══════════════════════════════════════════════════════════════ */}
//           {step === 3 && (
//             <div className="space-y-5 sm:space-y-6">

//               {/* Phase 3 — Non-blocking verify nudge (only for low-confidence GPS) */}
//               {showVerifyNudge && (
//                 <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
//                   <ShieldAlert size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
//                   <p className="text-[10px] sm:text-[11px] font-bold text-amber-700 leading-snug">
//                     Please verify your house / street number before saving — location confidence was low.
//                   </p>
//                 </div>
//               )}

//               {/* Address type selector */}
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
//                   Address Type
//                 </label>
//                 <div className="flex gap-2">
//                   {["home", "work", "other"].map((t) => (
//                     <button
//                       key={t} type="button" onClick={() => setType(t)}
//                       className={`flex-1 py-3 sm:py-4 rounded-2xl border-2 font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
//                         form.addressType === t
//                           ? "bg-black text-white border-black"
//                           : "bg-gray-50 text-gray-400 border-transparent hover:border-gray-200"
//                       }`}
//                     >
//                       {t}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Delivery instructions */}
//               <Field
//                 label="Delivery Instructions" name="deliveryInstructions"
//                 value={form.deliveryInstructions} onChange={handleChange}
//                 placeholder="Ring bell / call on arrival"
//               />

//               {/* Toggles */}
//               <div className="bg-gray-50 p-4 sm:p-6 rounded-3xl space-y-4">
//                 {[
//                   { key: "isDefault", label: "Set as default address", color: "bg-black"     },
//                   { key: "isGift",    label: "This is a gift 🎁",       color: "bg-[#F7A221]" },
//                 ].map(({ key, label, color }) => (
//                   <div
//                     key={key}
//                     className="flex items-center justify-between cursor-pointer"
//                     onClick={() => toggleBoolean(key)}
//                   >
//                     <span className="text-[10px] sm:text-xs font-black text-gray-600 uppercase tracking-widest pr-4">
//                       {label}
//                     </span>
//                     <div className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors ${form[key] ? color : "bg-gray-200"}`}>
//                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form[key] ? "translate-x-5" : "translate-x-1"}`} />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Error display */}
//           {(formError || error) && !isMapOpen && (
//             <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 mt-4">
//               <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
//               <p className="text-[11px] sm:text-xs font-bold text-red-700">
//                 {formError || error?.message || "Something went wrong"}
//               </p>
//             </div>
//           )}
//         </div>

//         {/* ── Footer — hidden when map is open (map has its own CTA buttons) */}
//         {!isMapOpen && (
//           <div className="px-5 sm:px-8 py-4 sm:py-5 bg-gray-50 border-t border-gray-100 flex gap-2 sm:gap-3 flex-shrink-0">
//             {step > 1 && (
//               <button
//                 onClick={() => { setFormError(null); setStep(step - 1); }}
//                 className="px-4 sm:px-5 py-3.5 rounded-2xl border-2 border-gray-200 font-black text-[10px] uppercase tracking-widest hover:border-black transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
//               >
//                 <ChevronLeft size={14} />
//               </button>
//             )}

//             {step < 3 ? (
//               <button
//                 onClick={handleNext}
//                 className="flex-1 py-3.5 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer"
//               >
//                 Continue <ChevronRight size={14} />
//               </button>
//             ) : (
//               <button
//                 onClick={handleFinalSubmit}
//                 disabled={isSaving}
//                 className="flex-1 py-3.5 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer disabled:cursor-not-allowed"
//               >
//                 {isSaving ? "Saving…" : initial ? "Update Address" : "Save Address"}
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//     </div>,
//     document.body
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // AddressCard
// // ─────────────────────────────────────────────────────────────────────────────
// const AddressCard = ({ address, isDefault, onEdit, onDelete, onSetDefault, isDeleting }) => (
//   <div className={`p-5 sm:p-6 bg-white rounded-[28px] sm:rounded-[32px] relative overflow-hidden transition-all duration-300 border-2 cursor-pointer hover:shadow-xl ${
//     isDefault
//       ? "border-black shadow-xl ring-4 ring-black/5"
//       : "border-gray-100 hover:border-black"
//   }`}>
//     {/* Default badge */}
//     {isDefault && (
//       <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1 bg-black text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
//         <Star size={8} className="fill-[#F7A221] text-[#F7A221]" /> Default
//       </div>
//     )}

//     {/* Type icon + label */}
//     <div className="flex items-center gap-2 mb-3 sm:mb-4">
//       <div className="p-2 bg-gray-50 rounded-lg">
//         {ADDRESS_TYPE_ICON[address.addressType] || ADDRESS_TYPE_ICON.other}
//       </div>
//       <span className="font-black uppercase text-[10px] tracking-widest text-gray-400">
//         {address.addressType}
//       </span>
//     </div>

//     {/* Name + phone */}
//     <h4 className="font-black text-gray-900 text-sm sm:text-base">{address.fullName}</h4>
//     <p className="text-xs text-gray-400 font-bold mb-3 sm:mb-4">{address.phone}</p>

//     {/* Address lines */}
//     <p className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed min-h-[48px] sm:min-h-[56px]">
//       {[address.houseNumber, address.area, address.landmark, address.addressLine1, address.addressLine2]
//         .filter(Boolean).join(", ")}
//       <br />
//       <span className="text-gray-900 font-bold">
//         {address.city}, {address.state} — {address.postalCode}
//       </span>
//     </p>

//     {/* Card actions */}
//     <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-50 flex items-center gap-3 flex-wrap">
//       {!isDefault && (
//         <button
//           onClick={(e) => { e.stopPropagation(); onSetDefault(address); }}
//           className="text-[10px] font-black uppercase tracking-widest text-[#F7A221] hover:underline cursor-pointer"
//         >
//           Set Default
//         </button>
//       )}
//       <button
//         onClick={(e) => { e.stopPropagation(); onEdit(address); }}
//         className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black cursor-pointer"
//       >
//         <Pencil size={11} /> Edit
//       </button>
//       <button
//         onClick={(e) => { e.stopPropagation(); onDelete(address._id); }}
//         disabled={isDeleting}
//         className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
//       >
//         {isDeleting ? <RefreshCw size={11} className="animate-spin" /> : <Trash2 size={11} />}
//       </button>
//     </div>
//   </div>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// // UserAddress — root component
// // ─────────────────────────────────────────────────────────────────────────────
// const UserAddress = () => {
//   const dispatch       = useDispatch();
//   const defaultAddress = useSelector(selectDefaultAddress);
//   const otherAddresses = useSelector(selectOtherAddresses);
//   const loading        = useSelector(selectAddressLoading);
//   const error          = useSelector(selectAddressError);

//   const [modalOpen,   setModalOpen]   = useState(false);
//   const [editAddress, setEditAddress] = useState(null);
//   const [deletingId,  setDeletingId]  = useState(null);

//   // Fetch all addresses on mount; clear errors on unmount
//   useEffect(() => {
//     dispatch(fetchAddresses());
//     return () => dispatch(clearAddressErrors());
//   }, [dispatch]);

//   const showSuccess = (msg) => toast.success(msg, { theme: "dark" });
//   const showError   = (msg) => toast.error(msg,   { theme: "dark" });

//   const openAdd    = ()     => { setEditAddress(null); setModalOpen(true);  dispatch(clearAddressErrors()); };
//   const openEdit   = (addr) => { setEditAddress(addr); setModalOpen(true);  dispatch(clearAddressErrors()); };
//   const closeModal = ()     => { setModalOpen(false);  setEditAddress(null); };

//   // ── Add or update ──────────────────────────────────────────────────────────
//   const handleSubmit = async (formData) => {
//     try {
//       if (editAddress) {
//         await dispatch(updateAddress({ id: editAddress._id, ...formData })).unwrap();
//         showSuccess("Address updated!");
//       } else {
//         await dispatch(addAddress(formData)).unwrap();
//         showSuccess("Address added!");
//       }
//       closeModal();
//     } catch (e) {
//       showError(e?.message || "Failed to save address");
//     }
//   };

//   // ── Delete ─────────────────────────────────────────────────────────────────
//   const handleDelete = async (id) => {
//     if (!window.confirm("Delete this address?")) return;
//     setDeletingId(id);
//     try {
//       await dispatch(deleteAddress(id)).unwrap();
//       showSuccess("Address removed");
//     } catch (e) {
//       showError(e?.message || "Failed to delete");
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   // ── Set default ────────────────────────────────────────────────────────────
//   const handleSetDefault = async (addr) => {
//     try {
//       await dispatch(updateAddress({ id: addr._id, isDefault: true })).unwrap();
//       showSuccess("Default address updated");
//     } catch (e) {
//       showError(e?.message || "Failed to set default");
//     }
//   };

//   const allCount = (defaultAddress ? 1 : 0) + otherAddresses.length;

//   return (
//     <div className="max-w-6xl mx-auto py-6 sm:py-10 px-4">

//       {/* ── Page header ───────────────────────────────────────────────────── */}
//       <div className="flex justify-between items-center mb-6 sm:mb-10 pb-6 sm:pb-8 border-b border-gray-100">
//         <div>
//           <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
//             Saved Addresses
//           </h1>
//           <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
//             {allCount} Total
//           </p>
//         </div>
//         <button
//           onClick={openAdd}
//           className="bg-black text-white px-5 sm:px-8 py-3 sm:py-4 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all cursor-pointer hover:bg-[#F7A221] hover:text-black flex items-center gap-1.5 sm:gap-2"
//         >
//           <Plus size={16} className="flex-shrink-0" />
//           <span>Add New</span>
//         </button>
//       </div>

//       {/* ── Fetch error banner ─────────────────────────────────────────────── */}
//       {error.fetch && (
//         <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-4">
//           <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
//           <p className="text-xs font-bold text-red-700 flex-1">
//             {error.fetch.message || "Failed to load"}
//           </p>
//           <button
//             onClick={() => dispatch(fetchAddresses())}
//             className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 cursor-pointer flex-shrink-0"
//           >
//             Retry
//           </button>
//         </div>
//       )}

//       {/* ── Loading skeletons ──────────────────────────────────────────────── */}
//       {loading.fetch ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
//           {[1, 2, 3].map((i) => (
//             <div key={i} className="h-56 sm:h-64 bg-gray-50 rounded-[32px] sm:rounded-[40px] animate-pulse" />
//           ))}
//         </div>

//       /* ── Empty state ────────────────────────────────────────────────────── */
//       ) : allCount === 0 ? (
//         <div className="flex flex-col items-center justify-center py-16 sm:py-20 gap-5 text-center">
//           <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-full flex items-center justify-center">
//             <MapPin size={38} className="text-gray-300" />
//           </div>
//           <h3 className="font-black text-gray-900 text-lg sm:text-xl">No addresses yet</h3>
//           <button
//             onClick={openAdd}
//             className="bg-black text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer"
//           >
//             <Plus size={14} className="inline mr-2" /> Add Address
//           </button>
//         </div>

//       /* ── Address grid ───────────────────────────────────────────────────── */
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
//           {defaultAddress && (
//             <AddressCard
//               address={defaultAddress} isDefault
//               onEdit={openEdit} onDelete={handleDelete}
//               onSetDefault={handleSetDefault}
//               isDeleting={deletingId === defaultAddress._id}
//             />
//           )}
//           {otherAddresses.map((addr) => (
//             <AddressCard
//               key={addr._id}
//               address={addr} isDefault={false}
//               onEdit={openEdit} onDelete={handleDelete}
//               onSetDefault={handleSetDefault}
//               isDeleting={deletingId === addr._id}
//             />
//           ))}
//         </div>
//       )}

//       {/* ── Modal ─────────────────────────────────────────────────────────── */}
//       {modalOpen && (
//         <AddressFormModal
//           initial={editAddress}
//           onSubmit={handleSubmit}
//           onClose={closeModal}
//           isSaving={loading.add || loading.update}
//           error={error.add || error.update}
//         />
//       )}
//     </div>
//   );
// };

// export default UserAddress;
// // code is working but upper code have maps integration 

// // import React, { useEffect, useState, useCallback } from "react";
// // import { createPortal } from "react-dom"; // Added for cleaner rendering
// // import { useDispatch, useSelector } from "react-redux";
// // import { toast } from "react-toastify";
// // import {
// //   MapPin, Plus, Home, Briefcase, Star,
// //   Pencil, Trash2, X, RefreshCw, AlertCircle, CheckCircle2,
// //   ChevronRight, ChevronLeft
// // } from "lucide-react";

// // import {
// //   fetchAddresses,
// //   addAddress,
// //   updateAddress,
// //   deleteAddress,
// //   clearAddressErrors,
// //   selectDefaultAddress,
// //   selectOtherAddresses,
// //   selectAddressLoading,
// //   selectAddressError,
// // } from "../../../components/REDUX_FEATURES/REDUX_SLICES/Useraddressslice";

// // // ─────────────────────────────────────────────────────────────────────────────
// // // Shared Sub-Components
// // // ─────────────────────────────────────────────────────────────────────────────

// // const Field = ({ label, name, value, onChange, required, type = "text", placeholder, maxLength }) => (
// //   <div className="flex flex-col gap-1.5 w-full">
// //     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
// //       {label}{required && <span className="text-red-400 ml-1">*</span>}
// //     </label>
// //     <input
// //       type={type}
// //       name={name}
// //       value={value}
// //       onChange={onChange}
// //       placeholder={placeholder}
// //       maxLength={maxLength}
// //       className="bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold outline-none transition-all w-full cursor-pointer focus:cursor-text"
// //     />
// //   </div>
// // );

// // const ADDRESS_TYPE_ICON = {
// //   home: <Home size={15} className="text-[#F7A221]" />,
// //   work: <Briefcase size={15} className="text-blue-500" />,
// //   other: <MapPin size={15} className="text-gray-400" />,
// // };

// // const EMPTY_FORM = {
// //   fullName: "", phone: "", houseNumber: "", area: "",
// //   landmark: "", addressLine1: "", addressLine2: "",
// //   city: "", state: "", postalCode: "", country: "India",
// //   addressType: "home", isDefault: false,
// //   isGift: false, deliveryInstructions: "",
// // };

// // // ─────────────────────────────────────────────────────────────────────────────
// // // Address Card
// // // ─────────────────────────────────────────────────────────────────────────────
// // const AddressCard = ({ address, isDefault, onEdit, onDelete, onSetDefault, isDeleting }) => (
// //   <div className={`p-6 bg-white rounded-[32px] relative overflow-hidden transition-all duration-300 border-2 cursor-pointer hover:shadow-xl ${
// //     isDefault ? "border-black shadow-xl ring-4 ring-black/5" : "border-gray-100 hover:border-black"
// //   }`}>
// //     {isDefault && (
// //       <div className="absolute top-4 right-4 flex items-center gap-1 bg-black text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
// //         <Star size={10} className="fill-[#F7A221] text-[#F7A221]" /> Default
// //       </div>
// //     )}
// //     <div className="flex items-center gap-2 mb-4">
// //       <div className="p-2 bg-gray-50 rounded-lg">
// //         {ADDRESS_TYPE_ICON[address.addressType] || ADDRESS_TYPE_ICON.other}
// //       </div>
// //       <span className="font-black uppercase text-[10px] tracking-widest text-gray-400">
// //         {address.addressType}
// //       </span>
// //     </div>
// //     <h4 className="font-black text-gray-900 text-base">{address.fullName}</h4>
// //     <p className="text-xs text-gray-400 font-bold mb-4">{address.phone}</p>
// //     <p className="text-sm font-medium text-gray-600 leading-relaxed min-h-[60px]">
// //       {[address.houseNumber, address.area, address.landmark, address.addressLine1, address.addressLine2].filter(Boolean).join(", ")}
// //       <br />
// //       <span className="text-gray-900 font-bold">{address.city}, {address.state} — {address.postalCode}</span>
// //     </p>
// //     <div className="mt-6 pt-6 border-t border-gray-50 flex items-center gap-4">
// //       {!isDefault && (
// //         <button 
// //           onClick={(e) => { e.stopPropagation(); onSetDefault(address); }} 
// //           className="text-[10px] font-black uppercase tracking-widest text-[#F7A221] hover:underline cursor-pointer"
// //         >
// //           Set Default
// //         </button>
// //       )}
// //       <button 
// //         onClick={(e) => { e.stopPropagation(); onEdit(address); }} 
// //         className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black cursor-pointer"
// //       >
// //         <Pencil size={12} /> Edit
// //       </button>
// //       <button 
// //         onClick={(e) => { e.stopPropagation(); onDelete(address._id); }} 
// //         disabled={isDeleting} 
// //         className="ml-auto flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
// //       >
// //         {isDeleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
// //       </button>
// //     </div>
// //   </div>
// // );

// // // ─────────────────────────────────────────────────────────────────────────────
// // // Address Form Modal (Fixed Flicker)
// // // ─────────────────────────────────────────────────────────────────────────────
// // const AddressFormModal = ({ initial, onSubmit, onClose, isSaving, error }) => {
// //   const [form, setForm] = useState(initial || EMPTY_FORM);
// //   const [step, setStep] = useState(1);
// //   const [formError, setFormError] = useState(null);

// //   useEffect(() => {
// //     // Calculate scrollbar width to prevent "flicker/jump"
// //     const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
// //     document.body.style.overflow = 'hidden';
// //     document.body.style.paddingRight = `${scrollBarWidth}px`; // Compensate for scrollbar removal

// //     return () => {
// //       document.body.style.overflow = 'unset';
// //       document.body.style.paddingRight = '0px';
// //     };
// //   }, []);

// //   const handleChange = useCallback((e) => {
// //     const { name, value } = e.target;
// //     if (name === "phone") {
// //       const val = value.replace(/\D/g, "");
// //       if (val.length <= 10) setForm((prev) => ({ ...prev, [name]: val }));
// //       return;
// //     }
// //     setForm((prev) => ({ ...prev, [name]: value }));
// //   }, []);

// //   const toggleBoolean = (key) => setForm((prev) => ({ ...prev, [key]: !prev[key] }));
// //   const setType = (type) => setForm((prev) => ({ ...prev, addressType: type }));

// //   const validateStep = (currentStep) => {
// //     setFormError(null);
// //     if (currentStep === 1) {
// //       if (!form.fullName.trim()) return "Full Name is required";
// //       if (form.phone.length !== 10) return "Phone number must be exactly 10 digits";
// //     }
// //     if (currentStep === 2) {
// //       const req = ["houseNumber", "area", "city", "state", "postalCode"];
// //       for (const f of req) if (!form[f]?.trim()) return `${f.replace(/([A-Z])/g, ' $1')} is required`;
// //       if (!/^\d{6}$/.test(form.postalCode)) return "Postal code must be 6 digits";
// //     }
// //     return null;
// //   };

// //   const handleNext = () => {
// //     const err = validateStep(step);
// //     if (err) setFormError(err);
// //     else setStep(step + 1);
// //   };

// //   const handleFinalSubmit = (e) => {
// //     e.preventDefault();
// //     const err = validateStep(step);
// //     if (err) { setFormError(err); return; }
    
// //     const submissionData = { ...form };
// //     Object.keys(submissionData).forEach(key => {
// //         if (submissionData[key] === "") submissionData[key] = null;
// //     });
// //     onSubmit(submissionData);
// //   };

// //   // Using Portals to move modal to top level of DOM
// //   return createPortal(
// //     <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
// //       {/* Backdrop */}
// //       <div 
// //         className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
// //         onClick={onClose} 
// //       />
      
// //       {/* Modal Container */}
// //       <div className="relative bg-white rounded-[40px] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
// //         <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-50">
// //           <div className="flex items-center gap-3">
// //             {[1, 2, 3].map((s) => (
// //               <div key={s} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${step >= s ? "bg-black" : "bg-gray-100"}`} />
// //             ))}
// //           </div>
// //           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
// //             <X size={20} />
// //           </button>
// //         </div>

// //         <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
// //           <h2 className="text-2xl font-black text-gray-900 mb-6">
// //             {step === 1 && "Personal Info"}
// //             {step === 2 && "Address Details"}
// //             {step === 3 && "Preferences"}
// //           </h2>

// //           {(formError || error) && (
// //             <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-6">
// //               <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
// //               <p className="text-xs font-bold text-red-700">{formError || error?.message || "Internal Server Error"}</p>
// //             </div>
// //           )}

// //           <div className="space-y-5">
// //             {step === 1 && (
// //               <>
// //                 <Field label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} required placeholder="Ravi Kumar" />
// //                 <Field label="Phone Number" name="phone" value={form.phone} onChange={handleChange} required type="tel" placeholder="10-digit number" />
// //               </>
// //             )}

// //             {step === 2 && (
// //               <>
// //                 <div className="grid grid-cols-2 gap-4">
// //                   <Field label="House No." name="houseNumber" value={form.houseNumber} onChange={handleChange} required placeholder="42B" />
// //                   <Field label="Area" name="area" value={form.area} onChange={handleChange} required placeholder="Sector 12" />
// //                 </div>
// //                 <Field label="Landmark" name="landmark" value={form.landmark} onChange={handleChange} placeholder="Near City Mall" />
// //                 <Field label="Address Line 1" name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Building name, Floor etc." />
// //                 <Field label="Address Line 2" name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Additional details" />
// //                 <div className="grid grid-cols-2 gap-4">
// //                   <Field label="City" name="city" value={form.city} onChange={handleChange} required placeholder="Mumbai" />
// //                   <Field label="Pincode" name="postalCode" value={form.postalCode} onChange={handleChange} required placeholder="400001" maxLength={6} />
// //                 </div>
// //                 <Field label="State" name="state" value={form.state} onChange={handleChange} required placeholder="Maharashtra" />
// //               </>
// //             )}

// //             {step === 3 && (
// //               <div className="space-y-6">
// //                 <div className="space-y-2">
// //                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Address Type</label>
// //                   <div className="flex gap-2">
// //                     {["home", "work", "other"].map((t) => (
// //                       <button 
// //                         key={t} 
// //                         type="button" 
// //                         onClick={() => setType(t)} 
// //                         className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
// //                           form.addressType === t 
// //                             ? "bg-black text-white border-black" 
// //                             : "bg-gray-50 text-gray-400 border-transparent hover:border-gray-200"
// //                         }`}
// //                       >
// //                         {t}
// //                       </button>
// //                     ))}
// //                   </div>
// //                 </div>
// //                 <Field label="Delivery Instructions" name="deliveryInstructions" value={form.deliveryInstructions} onChange={handleChange} placeholder="Ring bell/Call on arrival" />
// //                 <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
// //                   <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleBoolean("isDefault")}>
// //                     <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Default Address</span>
// //                     <div className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${form.isDefault ? "bg-black" : "bg-gray-200"}`}>
// //                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isDefault ? "translate-x-5" : "translate-x-1"}`} />
// //                     </div>
// //                   </div>
// //                   <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleBoolean("isGift")}>
// //                     <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Is this a gift? 🎁</span>
// //                     <div className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${form.isGift ? "bg-[#F7A221]" : "bg-gray-200"}`}>
// //                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isGift ? "translate-x-5" : "translate-x-1"}`} />
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         </div>

// //         <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex gap-3">
// //           {step > 1 && (
// //             <button 
// //               onClick={() => setStep(step - 1)} 
// //               className="px-6 py-4 rounded-2xl border-2 border-gray-200 font-black text-[10px] uppercase tracking-widest hover:border-black transition-all cursor-pointer"
// //             >
// //               <ChevronLeft size={16} />
// //             </button>
// //           )}
// //           {step < 3 ? (
// //             <button 
// //               onClick={handleNext} 
// //               className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer"
// //             >
// //               Continue <ChevronRight size={16} />
// //             </button>
// //           ) : (
// //             <button 
// //               onClick={handleFinalSubmit} 
// //               disabled={isSaving} 
// //               className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 hover:bg-[#F7A221] hover:text-black transition-all cursor-pointer disabled:cursor-not-allowed"
// //             >
// //               {isSaving ? "Saving..." : initial ? "Update Address" : "Save Address"}
// //             </button>
// //           )}
// //         </div>
// //       </div>
// //     </div>,
// //     document.body
// //   );
// // };

// // // ─────────────────────────────────────────────────────────────────────────────
// // // UserAddress — Main Component
// // // ─────────────────────────────────────────────────────────────────────────────
// // const UserAddress = () => {
// //   const dispatch = useDispatch();
// //   const defaultAddress = useSelector(selectDefaultAddress);
// //   const otherAddresses = useSelector(selectOtherAddresses);
// //   const loading = useSelector(selectAddressLoading);
// //   const error = useSelector(selectAddressError);

// //   const [modalOpen, setModalOpen] = useState(false);
// //   const [editAddress, setEditAddress] = useState(null);
// //   const [deletingId, setDeletingId] = useState(null);
// //   const [successMsg, setSuccessMsg] = useState(null);

// //   useEffect(() => {
// //     dispatch(fetchAddresses());
// //     return () => dispatch(clearAddressErrors());
// //   }, [dispatch]);

// //   const showSuccess = (msg) => {
// //     toast.success(msg, { theme: "dark" });
// //     setSuccessMsg(msg);
// //     setTimeout(() => setSuccessMsg(null), 3000);
// //   };

// //   const showError = (msg) => {
// //     toast.error(msg, { theme: "dark" });
// //   };

// //   const openAdd = () => { setEditAddress(null); setModalOpen(true); dispatch(clearAddressErrors()); };
// //   const openEdit = (addr) => { setEditAddress(addr); setModalOpen(true); dispatch(clearAddressErrors()); };
// //   const closeModal = () => { setModalOpen(false); setEditAddress(null); };

// //   const handleSubmit = async (formData) => {
// //     try {
// //       if (editAddress) {
// //         await dispatch(updateAddress({ id: editAddress._id, ...formData })).unwrap();
// //         showSuccess("Address updated successfully!");
// //       } else {
// //         await dispatch(addAddress(formData)).unwrap();
// //         showSuccess("Address added successfully!");
// //       }
// //       closeModal();
// //     } catch (e) { 
// //       showError(e?.message || "Failed to save address");
// //     }
// //   };

// //   const handleDelete = async (id) => {
// //     if (!window.confirm("Delete this address?")) return;
// //     setDeletingId(id);
// //     try {
// //       await dispatch(deleteAddress(id)).unwrap();
// //       showSuccess("Address removed successfully");
// //     } catch (e) { 
// //       showError(e?.message || "Failed to delete address");
// //     } finally { setDeletingId(null); }
// //   };

// //   const handleSetDefault = async (addr) => {
// //     try {
// //       await dispatch(updateAddress({ id: addr._id, isDefault: true })).unwrap();
// //       showSuccess("Default address updated");
// //     } catch (e) { 
// //       showError(e?.message || "Failed to set default address");
// //     }
// //   };

// //   const allCount = (defaultAddress ? 1 : 0) + otherAddresses.length;

// //   return (
// //     <div className="max-w-6xl mx-auto py-10 px-4">
// //       <div className="flex justify-between items-center mb-10 pb-8 border-b border-gray-100">
// //         <div>
// //           <h1 className="text-3xl font-black text-gray-900 tracking-tight">Saved Addresses</h1>
// //           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{allCount} Total</p>
// //         </div>
// //         <button 
// //           onClick={openAdd} 
// //           className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all cursor-pointer hover:bg-[#F7A221] hover:text-black"
// //         >
// //           <Plus size={18} className="inline mr-2" /> Add New
// //         </button>
// //       </div>

// //       {error.fetch && (
// //         <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
// //           <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
// //           <p className="text-xs font-bold text-red-700 flex-1">{error.fetch.message || "Failed to load"}</p>
// //           <button onClick={() => dispatch(fetchAddresses())} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 cursor-pointer">Retry</button>
// //         </div>
// //       )}

// //       {loading.fetch ? (
// //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //           {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-gray-50 rounded-[40px] animate-pulse" />)}
// //         </div>
// //       ) : allCount === 0 ? (
// //         <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
// //           <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
// //             <MapPin size={40} className="text-gray-300" />
// //           </div>
// //           <h3 className="font-black text-gray-900 text-xl">No addresses yet</h3>
// //           <button onClick={openAdd} className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F7A221] transition-all cursor-pointer">
// //             <Plus size={16} className="inline mr-2" /> Add Address
// //           </button>
// //         </div>
// //       ) : (
// //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //           {defaultAddress && (
// //             <AddressCard address={defaultAddress} isDefault onEdit={openEdit} onDelete={handleDelete} onSetDefault={handleSetDefault} isDeleting={deletingId === defaultAddress._id} />
// //           )}
// //           {otherAddresses.map((addr) => (
// //             <AddressCard key={addr._id} address={addr} isDefault={false} onEdit={openEdit} onDelete={handleDelete} onSetDefault={handleSetDefault} isDeleting={deletingId === addr._id} />
// //           ))}
// //         </div>
// //       )}

// //       {modalOpen && (
// //         <AddressFormModal
// //           initial={editAddress}
// //           onSubmit={handleSubmit}
// //           onClose={closeModal}
// //           isSaving={loading.add || loading.update}
// //           error={error.add || error.update}
// //         />
// //       )}
// //     </div>
// //   );
// // };

// // export default UserAddress;
// // import React, { useEffect, useState } from "react";
// // import { useDispatch, useSelector } from "react-redux";
// // import {
// //   MapPin, Plus, Home, Briefcase, Star,
// //   Pencil, Trash2, X, RefreshCw, AlertCircle, CheckCircle2,
// // } from "lucide-react";

// // import {
// //   fetchAddresses,
// //   addAddress,
// //   updateAddress,
// //   deleteAddress,
// //   clearAddressErrors,
// //   selectDefaultAddress,
// //   selectOtherAddresses,
// //   selectAddressLoading,
// //   selectAddressError,
// // } from "../../../components/REDUX_FEATURES/REDUX_SLICES/Useraddressslice"; //Right Path

// // // ─────────────────────────────────────────────────────────────────────────────
// // // Helpers
// // // ─────────────────────────────────────────────────────────────────────────────
// // const logError = (context, error, info = {}) => {
// //   console.group(`🔴 [UserAddress] ERROR in ${context}`);
// //   console.error("Error:", error);
// //   console.log("Info:", info);
// //   console.groupEnd();
// // };

// // const ADDRESS_TYPE_ICON = {
// //   home:  <Home size={15} className="text-[#F7A221]" />,
// //   work:  <Briefcase size={15} className="text-blue-500" />,
// //   other: <MapPin size={15} className="text-gray-400" />,
// // };

// // const EMPTY_FORM = {
// //   fullName: "", phone: "", houseNumber: "", area: "",
// //   landmark: "", addressLine1: "", addressLine2: "",
// //   city: "", state: "", postalCode: "", country: "India",
// //   addressType: "home", isDefault: false,
// //   isGift: false, deliveryInstructions: "",
// // };

// // // ─────────────────────────────────────────────────────────────────────────────
// // // Address Card
// // // ─────────────────────────────────────────────────────────────────────────────
// // const AddressCard = ({ address, isDefault, onEdit, onDelete, onSetDefault, isDeleting }) => (
// //   <div className={`p-6 bg-white rounded-[32px] relative overflow-hidden transition-all duration-300 ${
// //     isDefault
// //       ? "border-4 border-black shadow-lg"
// //       : "border-2 border-gray-100 hover:border-black"
// //   }`}>
// //     {/* Default badge */}
// //     {isDefault && (
// //       <div className="absolute top-4 right-4 flex items-center gap-1 bg-black text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
// //         <Star size={10} className="fill-[#F7A221] text-[#F7A221]" />
// //         Default
// //       </div>
// //     )}

// //     {/* Type label */}
// //     <div className="flex items-center gap-2 mb-3">
// //       {ADDRESS_TYPE_ICON[address.addressType] || ADDRESS_TYPE_ICON.other}
// //       <span className="font-black uppercase text-[10px] tracking-widest text-gray-500 capitalize">
// //         {address.addressType}
// //       </span>
// //     </div>

// //     {/* Name + phone */}
// //     <p className="font-black text-gray-900 text-sm mb-1">{address.fullName}</p>
// //     <p className="text-xs text-gray-500 font-semibold mb-3">{address.phone}</p>

// //     {/* Address lines */}
// //     <p className="font-medium text-gray-700 text-sm leading-relaxed">
// //       {[
// //         address.houseNumber,
// //         address.area,
// //         address.landmark,
// //         address.addressLine1,
// //         address.addressLine2,
// //       ].filter(Boolean).join(", ")}
// //       <br />
// //       {address.city}, {address.state} – {address.postalCode}
// //       <br />
// //       {address.country}
// //     </p>

// //     {/* Delivery instructions */}
// //     {address.deliveryInstructions && (
// //       <p className="text-[10px] text-gray-400 mt-2 italic">
// //         📝 {address.deliveryInstructions}
// //       </p>
// //     )}

// //     {/* Actions */}
// //     <div className="mt-5 flex items-center gap-4 flex-wrap">
// //       {!isDefault && (
// //         <button
// //           onClick={() => onSetDefault(address)}
// //           className="text-[10px] font-black uppercase tracking-wider text-[#F7A221] hover:text-black transition-colors"
// //         >
// //           Set as Default
// //         </button>
// //       )}
// //       <button
// //         onClick={() => onEdit(address)}
// //         className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-black transition-colors"
// //       >
// //         <Pencil size={11} /> Edit
// //       </button>
// //       <button
// //         onClick={() => onDelete(address._id)}
// //         disabled={isDeleting}
// //         className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
// //       >
// //         {isDeleting
// //           ? <RefreshCw size={11} className="animate-spin" />
// //           : <Trash2 size={11} />
// //         }
// //         {isDeleting ? "Removing…" : "Remove"}
// //       </button>
// //     </div>
// //   </div>
// // );

// // // ─────────────────────────────────────────────────────────────────────────────
// // // Address Form Modal
// // // ─────────────────────────────────────────────────────────────────────────────
// // const AddressFormModal = ({ initial, onSubmit, onClose, isSaving, error }) => {
// //   const [form, setForm] = useState(initial || EMPTY_FORM);
// //   const [formError, setFormError] = useState(null);

// //   const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

// //   const validate = () => {
// //     const required = ["fullName", "phone", "houseNumber", "area", "city", "state", "postalCode"];
// //     for (const field of required) {
// //       if (!form[field]?.trim()) {
// //         return `${field.replace(/([A-Z])/g, " $1")} is required`;
// //       }
// //     }
// //     if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) {
// //       return "Phone must be 10 digits";
// //     }
// //     if (!/^\d{6}$/.test(form.postalCode)) {
// //       return "Postal code must be 6 digits";
// //     }
// //     return null;
// //   };

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     const err = validate();
// //     if (err) { setFormError(err); return; }
// //     setFormError(null);
// //     onSubmit(form);
// //   };

// //   const Field = ({ label, name, required, type = "text", placeholder }) => (
// //     <div className="flex flex-col gap-1">
// //       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
// //         {label}{required && <span className="text-red-400 ml-1">*</span>}
// //       </label>
// //       <input
// //         type={type}
// //         value={form[name]}
// //         onChange={(e) => set(name, e.target.value)}
// //         placeholder={placeholder}
// //         className="border-2 border-gray-100 focus:border-black rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-colors"
// //       />
// //     </div>
// //   );

// //   return (
// //     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
// //       {/* Overlay */}
// //       <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

// //       {/* Modal */}
// //       <div className="relative bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
// //         {/* Header */}
// //         <div className="sticky top-0 bg-white px-8 pt-8 pb-4 border-b border-gray-100 flex items-center justify-between z-10 rounded-t-[32px]">
// //           <h2 className="text-xl font-black tracking-tight">
// //             {initial ? "Edit Address" : "Add New Address"}
// //           </h2>
// //           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
// //             <X size={20} />
// //           </button>
// //         </div>

// //         <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">

// //           {/* Error */}
// //           {(formError || error) && (
// //             <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
// //               <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
// //               <p className="text-xs font-semibold text-red-700">
// //                 {formError || error?.message || "Something went wrong"}
// //               </p>
// //             </div>
// //           )}

// //           {/* Personal info */}
// //           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //             <Field label="Full Name" name="fullName" required placeholder="Ravi Kumar" />
// //             <Field label="Phone" name="phone" required type="tel" placeholder="9876543210" />
// //           </div>

// //           {/* Address */}
// //           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //             <Field label="House / Flat No." name="houseNumber" required placeholder="42B" />
// //             <Field label="Area / Colony" name="area" required placeholder="HSR Layout" />
// //           </div>
// //           <Field label="Landmark" name="landmark" placeholder="Near HDFC Bank" />
// //           <Field label="Address Line 1" name="addressLine1" placeholder="Sector 3, Block A" />
// //           <Field label="Address Line 2" name="addressLine2" placeholder="Opposite Metro Station" />

// //           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
// //             <Field label="City" name="city" required placeholder="Bangalore" />
// //             <Field label="State" name="state" required placeholder="Karnataka" />
// //             <Field label="Postal Code" name="postalCode" required placeholder="560102" />
// //           </div>

// //           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
// //             <Field label="Country" name="country" placeholder="India" />

// //             {/* Address type */}
// //             <div className="flex flex-col gap-1">
// //               <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
// //                 Address Type
// //               </label>
// //               <div className="flex gap-2">
// //                 {["home", "work", "other"].map((t) => (
// //                   <button
// //                     key={t}
// //                     type="button"
// //                     onClick={() => set("addressType", t)}
// //                     className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl border-2 transition-all ${
// //                       form.addressType === t
// //                         ? "border-black bg-black text-white"
// //                         : "border-gray-100 text-gray-500 hover:border-gray-300"
// //                     }`}
// //                   >
// //                     {t}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>
// //           </div>

// //           <Field
// //             label="Delivery Instructions"
// //             name="deliveryInstructions"
// //             placeholder="Leave at door, ring bell twice…"
// //           />

// //           {/* Toggles */}
// //           <div className="flex flex-wrap gap-6">
// //             <label className="flex items-center gap-3 cursor-pointer group">
// //               <div
// //                 onClick={() => set("isDefault", !form.isDefault)}
// //                 className={`w-12 h-6 rounded-full transition-colors relative ${
// //                   form.isDefault ? "bg-black" : "bg-gray-200"
// //                 }`}
// //               >
// //                 <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
// //                   form.isDefault ? "translate-x-7" : "translate-x-1"
// //                 }`} />
// //               </div>
// //               <span className="text-xs font-black uppercase tracking-wider text-gray-600 group-hover:text-black transition-colors">
// //                 Set as Default
// //               </span>
// //             </label>

// //             <label className="flex items-center gap-3 cursor-pointer group">
// //               <div
// //                 onClick={() => set("isGift", !form.isGift)}
// //                 className={`w-12 h-6 rounded-full transition-colors relative ${
// //                   form.isGift ? "bg-[#F7A221]" : "bg-gray-200"
// //                 }`}
// //               >
// //                 <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
// //                   form.isGift ? "translate-x-7" : "translate-x-1"
// //                 }`} />
// //               </div>
// //               <span className="text-xs font-black uppercase tracking-wider text-gray-600 group-hover:text-black transition-colors">
// //                 Gift Address 🎁
// //               </span>
// //             </label>
// //           </div>

// //           {/* Submit */}
// //           <div className="flex gap-3 pt-2">
// //             <button
// //               type="button"
// //               onClick={onClose}
// //               className="flex-1 py-4 border-2 border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 hover:border-black transition-all active:scale-95"
// //             >
// //               Cancel
// //             </button>
// //             <button
// //               type="submit"
// //               disabled={isSaving}
// //               className="flex-1 py-4 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#F7A221] hover:text-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
// //             >
// //               {isSaving ? (
// //                 <><RefreshCw size={14} className="animate-spin" /> Saving…</>
// //               ) : (
// //                 initial ? "Update Address" : "Save Address"
// //               )}
// //             </button>
// //           </div>
// //         </form>
// //       </div>
// //     </div>
// //   );
// // };

// // // ─────────────────────────────────────────────────────────────────────────────
// // // UserAddress — Main Page
// // // ─────────────────────────────────────────────────────────────────────────────
// // const UserAddress = () => {
// //   const dispatch = useDispatch();

// //   const defaultAddress = useSelector(selectDefaultAddress);
// //   const otherAddresses = useSelector(selectOtherAddresses);
// //   const loading        = useSelector(selectAddressLoading);
// //   const error          = useSelector(selectAddressError);

// //   const [modalOpen,    setModalOpen]    = useState(false);
// //   const [editAddress,  setEditAddress]  = useState(null);   // null = add mode
// //   const [deletingId,   setDeletingId]   = useState(null);
// //   const [successMsg,   setSuccessMsg]   = useState(null);

// //   // ── Fetch on mount ─────────────────────────────────────────────────────────
// //   useEffect(() => {
// //     dispatch(fetchAddresses())
// //       .unwrap()
// //       .then(() => console.log("✅ [UserAddress] addresses loaded"))
// //       .catch((e) => logError("fetchAddresses", e));

// //     return () => dispatch(clearAddressErrors());
// //   }, [dispatch]);

// //   // ── Show success message briefly ───────────────────────────────────────────
// //   const showSuccess = (msg) => {
// //     setSuccessMsg(msg);
// //     setTimeout(() => setSuccessMsg(null), 3000);
// //   };

// //   // ── Handlers ──────────────────────────────────────────────────────────────
// //   const openAdd  = () => { setEditAddress(null); setModalOpen(true); dispatch(clearAddressErrors()); };
// //   const openEdit = (addr) => { setEditAddress(addr); setModalOpen(true); dispatch(clearAddressErrors()); };
// //   const closeModal = () => { setModalOpen(false); setEditAddress(null); };

// //   const handleSubmit = async (formData) => {
// //     try {
// //       if (editAddress) {
// //         await dispatch(updateAddress({ id: editAddress._id, ...formData })).unwrap();
// //         showSuccess("Address updated successfully");
// //         console.log(`✅ [UserAddress] updated: ${editAddress._id}`);
// //       } else {
// //         await dispatch(addAddress(formData)).unwrap();
// //         showSuccess("Address added successfully");
// //         console.log("✅ [UserAddress] new address added");
// //       }
// //       closeModal();
// //     } catch (e) {
// //       logError(editAddress ? "updateAddress" : "addAddress", e, { formData });
// //       // error already in Redux state — modal stays open and shows error
// //     }
// //   };

// //   const handleDelete = async (id) => {
// //     if (!window.confirm("Remove this address?")) return;
// //     setDeletingId(id);
// //     try {
// //       await dispatch(deleteAddress(id)).unwrap();
// //       showSuccess("Address removed");
// //       console.log(`✅ [UserAddress] deleted: ${id}`);
// //     } catch (e) {
// //       logError("deleteAddress", e, { id });
// //     } finally {
// //       setDeletingId(null);
// //     }
// //   };

// //   const handleSetDefault = async (addr) => {
// //     try {
// //       await dispatch(updateAddress({ id: addr._id, isDefault: true })).unwrap();
// //       showSuccess("Default address updated");
// //       console.log(`✅ [UserAddress] set default: ${addr._id}`);
// //     } catch (e) {
// //       logError("handleSetDefault", e, { id: addr._id });
// //     }
// //   };

// //   const allCount = (defaultAddress ? 1 : 0) + otherAddresses.length;
// //   const isSaving = loading.add || loading.update;

// //   // ── Render ────────────────────────────────────────────────────────────────
// //   return (
// //     <div className="space-y-8">

// //       {/* Header */}
// //       <div className="flex justify-between items-center flex-wrap gap-4">
// //         <div>
// //           <h1 className="text-3xl font-black text-gray-900 tracking-tight">
// //             Delivery Addresses
// //           </h1>
// //           {!loading.fetch && (
// //             <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mt-1">
// //               {allCount} saved address{allCount !== 1 ? "es" : ""}
// //             </p>
// //           )}
// //         </div>
// //         <button
// //           onClick={openAdd}
// //           className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F7A221] hover:text-black transition-all active:scale-95 shadow-lg"
// //         >
// //           <Plus size={16} /> Add New
// //         </button>
// //       </div>

// //       {/* Success banner */}
// //       {successMsg && (
// //         <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-3">
// //           <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
// //           <p className="text-xs font-bold text-green-700">{successMsg}</p>
// //         </div>
// //       )}

// //       {/* Fetch error */}
// //       {error.fetch && (
// //         <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
// //           <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
// //           <div className="flex-1">
// //             <p className="text-xs font-bold text-red-700">
// //               {error.fetch.message || "Failed to load addresses"}
// //             </p>
// //           </div>
// //           <button
// //             onClick={() => dispatch(fetchAddresses())}
// //             className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors whitespace-nowrap"
// //           >
// //             Retry
// //           </button>
// //         </div>
// //       )}

// //       {/* Delete error */}
// //       {error.delete && (
// //         <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-3">
// //           <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
// //           <p className="text-xs font-semibold text-red-700 flex-1">
// //             {error.delete.message || "Failed to remove address"}
// //           </p>
// //           <button onClick={() => dispatch(clearAddressErrors())} className="text-red-300 hover:text-red-500">
// //             <X size={14} />
// //           </button>
// //         </div>
// //       )}

// //       {/* Loading skeleton */}
// //       {loading.fetch && (
// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //           {[...Array(2)].map((_, i) => (
// //             <div key={i} className="h-52 bg-gray-100 rounded-[32px] animate-pulse" />
// //           ))}
// //         </div>
// //       )}

// //       {/* Empty state */}
// //       {!loading.fetch && allCount === 0 && !error.fetch && (
// //         <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
// //           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
// //             <MapPin size={32} className="text-gray-200" />
// //           </div>
// //           <div>
// //             <h3 className="font-black text-gray-900 uppercase tracking-tight mb-1">
// //               No addresses yet
// //             </h3>
// //             <p className="text-gray-400 text-sm font-medium">
// //               Add your first delivery address to get started
// //             </p>
// //           </div>
// //           <button
// //             onClick={openAdd}
// //             className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#F7A221] hover:text-black transition-all active:scale-95"
// //           >
// //             <Plus size={16} /> Add Address
// //           </button>
// //         </div>
// //       )}

// //       {/* Address cards */}
// //       {!loading.fetch && allCount > 0 && (
// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //           {/* Default first */}
// //           {defaultAddress && (
// //             <AddressCard
// //               key={defaultAddress._id}
// //               address={defaultAddress}
// //               isDefault
// //               onEdit={openEdit}
// //               onDelete={handleDelete}
// //               onSetDefault={handleSetDefault}
// //               isDeleting={deletingId === defaultAddress._id}
// //             />
// //           )}
// //           {/* Others */}
// //           {otherAddresses.map((addr) => (
// //             <AddressCard
// //               key={addr._id}
// //               address={addr}
// //               isDefault={false}
// //               onEdit={openEdit}
// //               onDelete={handleDelete}
// //               onSetDefault={handleSetDefault}
// //               isDeleting={deletingId === addr._id}
// //             />
// //           ))}
// //         </div>
// //       )}

// //       {/* Add / Edit Modal */}
// //       {modalOpen && (
// //         <AddressFormModal
// //           initial={editAddress}
// //           onSubmit={handleSubmit}
// //           onClose={closeModal}
// //           isSaving={isSaving}
// //           error={error.add || error.update}
// //         />
// //       )}
// //     </div>
// //   );
// // };

// // export default UserAddress;

// // import React from 'react';
// // import { MapPin, Plus, Home, Briefcase } from 'lucide-react';

// // const UserAddress = () => {
// //   return (
// //     <div className="space-y-8">
// //       <div className="flex justify-between items-center">
// //         <h1 className="text-3xl font-black text-gray-900 tracking-tight">Delivery Addresses</h1>
// //         <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg">
// //           <Plus size={18} /> Add New
// //         </button>
// //       </div>

// //       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //         <div className="p-6 bg-white border-4 border-black rounded-[32px] relative overflow-hidden">
// //             <div className="flex items-center gap-2 mb-4">
// //                 <Home size={18} className="text-orange-500" />
// //                 <span className="font-black uppercase text-[10px] tracking-widest">Default - Home</span>
// //             </div>
// //             <p className="font-bold text-gray-900 leading-relaxed">
// //                 123 Sky Tower, HSR Layout<br />
// //                 Bangalore, Karnataka 560102<br />
// //                 India
// //             </p>
// //             <div className="mt-6 flex gap-4">
// //                 <button className="text-xs font-black uppercase text-gray-400 hover:text-black">Edit</button>
// //                 <button className="text-xs font-black uppercase text-red-500 hover:text-red-700">Remove</button>
// //             </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default UserAddress;
