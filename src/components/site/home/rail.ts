/**
 * Card rail: a swipeable scroll-snap carousel on phones, the regular grid from `sm` up.
 * Pair RAIL (on the list) with RAIL_ITEM (on each card) and add the grid columns per section.
 */
export const RAIL =
  "no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 pb-6 pt-4 sm:mx-0 sm:grid sm:snap-none sm:overflow-visible sm:p-0";
export const RAIL_ITEM = "h-auto w-[78%] max-w-[320px] shrink-0 snap-start sm:h-full sm:w-auto sm:max-w-none";
/** Small "swipe" hint shown under a rail on phones only. */
export const RAIL_HINT = "annot flex items-center gap-2 sm:hidden";
