import React from 'react';
import { Package, Truck, CheckCircle, ChevronRight } from 'lucide-react';

const UserOrders = () => {
  const orders = [
    { id: 'ORD-88291', date: 'March 15, 2026', status: 'In Transit', total: '₹2,499', items: 2 },
    { id: 'ORD-77210', date: 'March 02, 2026', status: 'Delivered', total: '₹1,200', items: 1 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <header>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Purchase History</h1>
        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mt-1">Track & Manage Orders</p>
      </header>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="group bg-gray-50 rounded-3xl p-6 border-2 border-transparent hover:border-black hover:bg-white transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-400">
                   <Package size={32} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900">{order.id}</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-tighter">{order.date}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col justify-between md:items-end border-t md:border-t-0 pt-4 md:pt-0">
                <p className="text-2xl font-black text-gray-900">{order.total}</p>
                <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 hover:text-black transition-colors">
                  View Details <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserOrders;