import React from 'react';
import { MapPin, Plus, Home, Briefcase } from 'lucide-react';

const UserAddress = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Delivery Addresses</h1>
        <button className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg">
          <Plus size={18} /> Add New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border-4 border-black rounded-[32px] relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
                <Home size={18} className="text-orange-500" />
                <span className="font-black uppercase text-[10px] tracking-widest">Default - Home</span>
            </div>
            <p className="font-bold text-gray-900 leading-relaxed">
                123 Sky Tower, HSR Layout<br />
                Bangalore, Karnataka 560102<br />
                India
            </p>
            <div className="mt-6 flex gap-4">
                <button className="text-xs font-black uppercase text-gray-400 hover:text-black">Edit</button>
                <button className="text-xs font-black uppercase text-red-500 hover:text-red-700">Remove</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserAddress;