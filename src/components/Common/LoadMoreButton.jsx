const LoadMoreButton = ({ onLoadMore, isFetchingMore, hasNextPage }) => {

  if (isFetchingMore) return (
    <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 font-semibold mt-10">
      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Loading more...
    </div>
  );

  if (hasNextPage) return (
    <div className="flex justify-center mt-10">
      <button
        onClick={onLoadMore}
        disabled={isFetchingMore}
        className="inline-flex items-center gap-3 px-10 py-3 text-[11px] font-black uppercase tracking-[0.2em] border-2 border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-900 hover:text-white active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Load More
      </button>
    </div>
  );

  return (
    <p className="text-center text-xs text-zinc-400 font-medium uppercase tracking-widest mt-10">
      You've seen all products
    </p>
  );
};

export default LoadMoreButton;