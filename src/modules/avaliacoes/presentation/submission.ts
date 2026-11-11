export type EvaluationSubmissionController = {
  mount: () => void;
  unmount: () => void;
  begin: () => number;
  invalidate: () => boolean;
  canCommit: (requestId: number) => boolean;
  finish: (requestId: number) => boolean;
  isSubmitting: () => boolean;
};

export function createEvaluationSubmissionController(): EvaluationSubmissionController {
  let mounted = false;
  let currentRequestId = 0;
  let submitting = false;

  const canCommit = (requestId: number) => mounted && requestId === currentRequestId;

  return {
    mount: () => { mounted = true; },
    unmount: () => {
      mounted = false;
      currentRequestId += 1;
      submitting = false;
    },
    begin: () => {
      currentRequestId += 1;
      submitting = true;
      return currentRequestId;
    },
    invalidate: () => {
      if (!submitting) return false;
      currentRequestId += 1;
      submitting = false;
      return true;
    },
    canCommit,
    finish: (requestId: number) => {
      if (!canCommit(requestId)) return false;
      submitting = false;
      return true;
    },
    isSubmitting: () => submitting,
  };
}
