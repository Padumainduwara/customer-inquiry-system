import { InquiryStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<InquiryStatus, InquiryStatus[]> = {
  NEW: [InquiryStatus.IN_PROGRESS],
  IN_PROGRESS: [InquiryStatus.RESOLVED],
  RESOLVED: [], // Final state: cannot be reopened
};

export function canTransitionStatus(
  current: InquiryStatus,
  next: InquiryStatus
): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next);
}

export function getAllowedNextStatuses(current: InquiryStatus): InquiryStatus[] {
  return ALLOWED_TRANSITIONS[current];
}