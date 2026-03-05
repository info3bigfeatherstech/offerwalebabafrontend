import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addBrand } from '../ADMIN_REDUX_MANAGEMENT/brandSlice';

const BrandModal = ({ brands, onSelect, onClose }) => {
  const dispatch = useDispatch();
  const [newBrand, setNewBrand] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (newBrand.trim()) {
      setLoading(true);
      try {
        await dispatch(addBrand(newBrand.trim())).unwrap();
        onSelect(newBrand.trim());
        setNewBrand('');
        onClose();
      } catch (error) {
        alert('Error adding brand: ' + error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Brand</h3>
        <input
          type="text"
          value={newBrand}
          onChange={(e) => setNewBrand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
          placeholder="e.g., Apple"
          autoFocus
          disabled={loading}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !newBrand.trim()}
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandModal;


// code is operational but api integrated ************
// import React, { useState } from 'react';

// const BrandModal = ({ brands, setBrands, onSelect, onClose }) => {
//   const [newBrand, setNewBrand] = useState('');

//   const handleAdd = () => {
//     if (newBrand.trim()) {
//       setBrands([...brands, newBrand]);
//       onSelect(newBrand);
//       setNewBrand('');
//       onClose();
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
//       <div className="bg-white rounded-2xl max-w-md w-full p-6">
//         <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Brand</h3>
//         <input
//           type="text"
//           value={newBrand}
//           onChange={(e) => setNewBrand(e.target.value)}
//           onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
//           className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//           placeholder="e.g., Apple"
//           autoFocus
//         />
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 text-gray-600 hover:text-gray-800"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleAdd}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             Add
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BrandModal;