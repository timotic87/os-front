/**
 * Flow status constants for deal workflows.
 * Used across REG, PY, and Stuffing flows.
 */
export const FLOW_STATUS = {
  // CDCM Phase (PY & Stuffing only)
  CDCM_APPROVED: 4,

  // Offer Phase
  OFFER_CLIENT_REVIEW: 7,
  OFFER_SENT_TO_CLIENT: 8,

  // Contract Phase
  CONTRACT_START: 9,
  CONTRACT_CLIENT_REVIEW: 11,
  CONTRACT_SENT_TO_CLIENT: 12,

  // Signing Phase
  CONTRACT_SIGNING: 13,

  // Recruiting Order Phase
  RECRUITING_ORDER: 14,
  RECRUITING_ORDER_CREATED: 15,
} as const;

export const DEAL_STATUS = {
  ACTIVE: 1,
  CANCELLED: 2,
  STOPPED: 3,
} as const;

export const DOCUMENT_TYPE = {
  OFFER: 1,
  CONTRACT: 2,
} as const;

export const APPROVAL_STATUS = {
  DRAFT: 1,
  APPROVED: 2,
  DECLINED: 3,
} as const;
