const ProductTableSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4">Product</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Brand</th>
            <th className="px-6 py-4">Price</th>
            <th className="px-6 py-4">Inventory</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Featured</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(8)].map((_, i) => (
            <tr key={i} className="border-b border-gray-100 animate-pulse">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
              <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
              <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
              <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
              <td className="px-6 py-4"><div className="h-7 bg-gray-200 rounded-xl w-20"></div></td>
              <td className="px-6 py-4"><div className="h-7 bg-gray-200 rounded-xl w-20"></div></td>
              <td className="px-6 py-4"><div className="flex gap-1"><div className="w-8 h-8 bg-gray-200 rounded-lg"></div><div className="w-8 h-8 bg-gray-200 rounded-lg"></div></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTableSkeleton;