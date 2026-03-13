
"use client";

import Ads from "./Ads";

// --- Ad Slot IDs ---
// These should correspond to the ad units you created in your AdSense account.
const AD_SLOT_IDS = {
    HORIZONTAL_RESPONSIVE: "1344169230", // Replace with your actual slot ID
    SQUARE_RESPONSIVE: "1344169230", // Replace with your actual slot ID
};

/**
 * A responsive horizontal ad placeholder.
 */
export const AdPlaceholder = () => (
    <Ads slot={AD_SLOT_IDS.HORIZONTAL_RESPONSIVE} type="horizontal" />
);

/**
 * A responsive square ad placeholder.
 */
export const AdPlaceholderSquare = () => (
    <Ads slot={AD_SLOT_IDS.SQUARE_RESPONSIVE} type="square" />
);
