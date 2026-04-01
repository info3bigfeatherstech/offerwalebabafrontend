import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCart,
  mergeCart,
  loadGuestCart,
  clearGuestCartItems,
  getGuestCart,
} from "../REDUX_FEATURES/REDUX_SLICES/userCartSlice";

const useCartInit = () => {
  const dispatch = useDispatch();
  const { isLoggedIn } = useSelector((state) => state.auth);

  // ── On app boot — always load guest cart from localStorage into Redux ──────
  useEffect(() => {
    console.log("🛒 [useCartInit] Loading guest cart from localStorage...");
    dispatch(loadGuestCart());
  }, [dispatch]);

  // ── When login state changes ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;

    const init = async () => {
      try {
        console.log("🛒 [useCartInit] User logged in — initializing cart...");

        // Step 1 — check guest cart
        const guestItems = getGuestCart();

        // Step 2 — merge guest cart into DB if items exist
        if (guestItems.length > 0) {
          console.log(`🛒 [useCartInit] Found ${guestItems.length} guest items — merging...`);

          // backend merge expects: [{ productId, variantId, quantity }]
          // but guest cart stores productSlug — so we send what we have
          // backend addToCart supports productSlug too via mergeCart
          await dispatch(mergeCart({ items: guestItems })).unwrap();
          dispatch(clearGuestCartItems());
          console.log("✅ [useCartInit] Guest cart merged and cleared");
        }

        // Step 3 — fetch full cart from DB
        await dispatch(fetchCart()).unwrap();
        console.log("✅ [useCartInit] Cart fetched successfully");

      } catch (error) {
        // Non-fatal — log but don't crash app
        console.group("🔴 [useCartInit] ERROR during cart init");
        console.error(error);
        console.groupEnd();
      }
    };

    init();
  }, [isLoggedIn, dispatch]);
};

export default useCartInit;