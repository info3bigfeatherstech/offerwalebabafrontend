// Shared_components/CategoryModal.jsx

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createCategory } from "../ADMIN_REDUX_MANAGEMENT/categoriesSlice";

// ── Props ────────────────────────────────────────────────────
// onSelect(categoryId) — called after user picks or creates a category
// onClose()           — close the modal
const CategoryModal = ({ onSelect, onClose }) => {
  const dispatch = useDispatch();

  // Categories + loading state from Redux
  const { categories, createLoading, createError } = useSelector(
    (state) => state.categories
  );

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  // ── Create new category via API ──────────────────────────────
  const handleCreate = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      alert("Category name is required");
      return;
    }

    const result = await dispatch(
      createCategory({ name, description: newCategoryDescription.trim() })
    );

    // If creation succeeded, auto-select the new category and close
    if (createCategory.fulfilled.match(result)) {
      const newCat = result.payload;
      onSelect(newCat._id);
      onClose();
    }
    // If failed, createError in Redux will show the error banner below
  };

  // ── Select existing ──────────────────────────────────────────
  const handleSelect = (catId) => {
    onSelect(catId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">

        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Manage Categories</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Error Banner */}
          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">❌ {createError}</p>
            </div>
          )}

          {/* Create New Category */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Create New Category</h4>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name (e.g., Electronics)"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <input
              type="text"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={createLoading || !newCategoryName.trim()}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "+ Create & Select"
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR SELECT EXISTING</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Existing Categories List */}
          <div className="max-h-52 overflow-y-auto space-y-1">
            {categories.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">
                No categories yet. Create one above.
              </p>
            ) : (
              categories
                .filter((c) => c.status !== "inactive") // hide soft-deleted
                .map((cat) => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => handleSelect(cat._id)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-sm text-gray-700 transition-colors flex items-center justify-between group"
                  >
                    <span className="font-medium">{cat.name}</span>
                    {cat.description && (
                      <span className="text-xs text-gray-400 group-hover:text-blue-500 truncate ml-3 max-w-[150px]">
                        {cat.description}
                      </span>
                    )}
                  </button>
                ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;

// code is working but upside code is api integrated ************
// import React, { useState } from 'react';

// const CategoryModal = ({ categories, setCategories, onSelect, onClose }) => {
//   const [newCategory, setNewCategory] = useState('');

//   const handleAdd = () => {
//     if (newCategory.trim()) {
//       const newCat = { _id: Date.now().toString(), name: newCategory };
//       setCategories([...categories, newCat]);
//       onSelect(newCat._id);
//       setNewCategory('');
//       onClose();
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
//       <div className="bg-white rounded-2xl max-w-md w-full p-6">
//         <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Category</h3>
//         <input
//           type="text"
//           value={newCategory}
//           onChange={(e) => setNewCategory(e.target.value)}
//           onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
//           className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4"
//           placeholder="e.g., Electronics"
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

// export default CategoryModal;