// import { Minus, Plus, RefreshCcw, ShoppingBag, Trash2 } from 'lucide-react';
// import React from 'react'
// import { Link } from 'react-router-dom';


// const fmt = (n) => {
//   if (n == null) return '—';
//   return new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 0,
//   }).format(n);
// };

// const CartComponent = ({ item, isLoggedIn, onUpdate, onRemove, isUpdating, isRemoving, name, image, price, brand, attrs, slug, itemTotal, qty }) => {
  
//   console.log("items", item);
  
//   return (
//      <div className="flex gap-4 sm:gap-6">

//         {/* Image */}
//         <div className="w-18 md:w-52 h-18 md:h-36 sm:w-32 sm:h-40 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
//           {image ? (
//             <img
//               src={image}
//               alt={name}
//               className="w-full h-full object-cover"
//               onError={(e) => {
//                 e.target.style.display = 'none';
//                 logError('CartRow img', new Error('Image failed'), { name, image });
//               }}
//             />
//           ) : (
//             <div className="w-full h-full flex items-center justify-center">
            
//               <ShoppingBag size={24} className="text-gray-300" />
//             </div>
//           )}
//         </div>

//         {/* Details */}
//         <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
//           <div className="flex justify-between items-start gap-2">
//             <div className="min-w-0">
//               {/* Name — clickable if slug exists */}
//               {slug ? (
              
//               <Link to={`/products/${slug}`}>
//                   <h3 className="font-black text-sm sm:text-lg text-red-900 leading-tight group-hover:text-[#F7A221] transition-colors">
//                     {name}
//                   </h3>
//                 </Link>
//               ) : (
//                 <h3 className="font-black text-base sm:text-lg text-gray-900 leading-tight truncate">
//                   {name}
//                 </h3>
//               )}

//               {/* Brand + variant attrs */}
//               <div className="flex flex-wrap items-center gap-1.5 mt-1">
//                 {brand && (
//                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
//                     {brand}
//                   </span>
//                 )}
//                 {attrs.map((a) => (
//                   <span
//                     key={a._id || a.key}
//                     className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter"
//                   >
//                     · {a.key}: {a.value}
//                   </span>
//                 ))}
//               </div>

//               {/* Unit price */}
//               <div className='font-semibold text-[#79AE6F] text-sm'>In Stock</div>
//             </div>

//             {/* Remove button */}
//             <button
//               onClick={() => onRemove(item)}
//               disabled={isRemoving}
//               aria-label="Remove item"
//               className="p-2 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40 flex-shrink-0"
//             >
//               {isRemoving
//                 ? <RefreshCcw size={18} className="animate-spin" />
//                 :
//                   <Trash2 size={18} className='hover:text-red-500' />
//               }
//             </button>
//           </div>

//           {/* Qty + total */}
//           <div className="flex justify-between items-end mt-4 flex-wrap gap-3">
//             {/* Qty selector */}
//             <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
//               <button
//                 onClick={() => onUpdate(item, qty - 1)}
//                 disabled={qty <= 1 || isUpdating}
//                 className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-40"
//                 aria-label="Decrease quantity"
//               >
//                 <Minus size={14} />
//               </button>
//               <span className="px-4 font-black text-sm min-w-[2rem] text-center">
//                 {isUpdating ? '…' : qty}
//               </span>
//               <button
//                 onClick={() => onUpdate(item, qty + 1)}
//                 disabled={isUpdating}
//                 className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all disabled:opacity-40"
//                 aria-label="Increase quantity"
//               >
//                 <Plus size={14} />
//               </button>
//             </div>

//             {/* Item total */}
//             {itemTotal != null && (
//               <p className="font-black text-xl text-gray-900">{fmt(itemTotal)}</p>
//             )}
//           </div>
//         </div>
//       </div>
//   )
// }


// export default CartComponent