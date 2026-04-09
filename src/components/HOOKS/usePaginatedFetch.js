import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const usePaginatedFetch = ({
  fetchAction,
  selectData,
  selectLoading,
  selectPagination,
  fetchParams = {},
  limit = 12,
}) => {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);

  const data       = useSelector(selectData);
  const isLoading  = useSelector(selectLoading);
  const pagination = useSelector(selectPagination);

  // ✅ Sab refs mein store karo — stale closure problem fix
  const fetchActionRef  = useRef(fetchAction);
  const fetchParamsRef  = useRef(fetchParams);
  const limitRef        = useRef(limit);
  const isLoadingRef    = useRef(isLoading);

  // Refs sync karo
  useEffect(() => { fetchActionRef.current  = fetchAction;  }, [fetchAction]);
  useEffect(() => { fetchParamsRef.current  = fetchParams;  }, [fetchParams]);
  useEffect(() => { limitRef.current        = limit;        }, [limit]);
  useEffect(() => { isLoadingRef.current    = isLoading;    }, [isLoading]);

  // ✅ Sirf page change pe fetch — limit ref se lo
  useEffect(() => {
    dispatch(fetchActionRef.current({
      ...fetchParamsRef.current,
      page,
      limit: limitRef.current,  // ← ref se lo
    }));
    if (page === 1) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, dispatch]);

  // fetchParams change hone pe page reset
  const fetchParamsStr = JSON.stringify(fetchParams);
  const prevFetchParamsStr = useRef(fetchParamsStr);
  useEffect(() => {
    if (prevFetchParamsStr.current !== fetchParamsStr) {
      prevFetchParamsStr.current = fetchParamsStr;
      setPage(1);
    }
  }, [fetchParamsStr]);

  // ✅ loadMore — ref se isLoading check karo, double click prevent karo
  const loadMore = useCallback(() => {
    if (pagination?.hasNextPage && !isLoadingRef.current) {
      setPage(prev => prev + 1);
    }
  }, [pagination?.hasNextPage]);

  const resetPage = useCallback(() => setPage(1), []);

  const isFetchingMore = isLoading && page > 1;

  return {
    data,
    isLoading,
    isFetchingMore,
    pagination,
    page,
    loadMore,
    resetPage,
  };
};


export default usePaginatedFetch;