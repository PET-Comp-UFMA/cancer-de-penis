import type { NextApiRequest, NextApiResponse } from "next";
import type { FormStatus } from "@/modules/formularios/domain/types";
import { removeOwnedForm, setOwnedFormStatus } from "@/modules/formularios/application/service";
import { noStore } from "@/modules/auth/server/cookies";
import { requireMutation, requireRole } from "@/modules/auth/server/guards";
import { authError, methodNotAllowed } from "@/modules/auth/server/http";

function queryId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);
  if (req.method !== "PATCH" && req.method !== "DELETE") return methodNotAllowed(res, "PATCH, DELETE");

  try {
    const context = await requireRole(req, "admin");
    requireMutation(req);
    const formId = queryId(req.query.id);
    if (!formId) throw new Error("INVALID_REQUEST");

    if (req.method === "PATCH") {
      const status = (req.body as { status?: unknown }).status;
      if (status !== "unpublished" && status !== "published") throw new Error("INVALID_REQUEST");
      const form = await setOwnedFormStatus({
        ownerId: context.user.id,
        formId,
        status: status as FormStatus,
      });
      return res.status(200).json(form);
    }

    await removeOwnedForm({ ownerId: context.user.id, formId });
    return res.status(204).end();
  } catch (error) {
    return authError(res, error);
  }
}
