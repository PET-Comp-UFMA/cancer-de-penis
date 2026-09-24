import type { NextApiRequest, NextApiResponse } from "next";
import type { FormStatus } from "@/modules/formularios/domain/types";
import { duplicateOwnedForm, readOwnedForm, removeOwnedForm, saveOwnedDefinition, setOwnedFormStatus } from "@/modules/formularios/application/service";
import { noStore } from "@/modules/auth/server/cookies";
import { requireMutation, requireRole } from "@/modules/auth/server/guards";
import { authError, methodNotAllowed } from "@/modules/auth/server/http";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

function queryId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  noStore(res);
  if (req.method !== "GET" && req.method !== "POST" && req.method !== "PATCH" && req.method !== "DELETE") return methodNotAllowed(res, "GET, POST, PATCH, DELETE");

  try {
    const context = await requireRole(req, "admin");
    const formId = queryId(req.query.id);
    if (!formId) throw new Error("INVALID_REQUEST");

    if (req.method === "GET") return res.status(200).json(await readOwnedForm({ ownerId: context.user.id, formId }));

    requireMutation(req);

    // POST /api/formularios/:id duplicates the form into a new unpublished draft.
    if (req.method === "POST") return res.status(201).json(await duplicateOwnedForm({ ownerId: context.user.id, formId }));

    if (req.method === "PATCH") {
      const body = req.body as { status?: unknown; definition?: unknown; expectedRevision?: unknown };
      if (body.definition !== undefined) {
        if (body.definition === undefined || body.expectedRevision === undefined) throw new Error("INVALID_REQUEST");
        return res.status(200).json(await saveOwnedDefinition({ ownerId: context.user.id, formId, definition: body.definition, expectedRevision: body.expectedRevision }));
      }
      const status = body.status;
      if (status !== "unpublished" && status !== "published") throw new Error("INVALID_REQUEST");
      const form = await setOwnedFormStatus({
        ownerId: context.user.id,
        formId,
        status: status as FormStatus,
        expectedRevision: body.expectedRevision,
      });
      return res.status(200).json(form);
    }

    await removeOwnedForm({ ownerId: context.user.id, formId });
    return res.status(204).end();
  } catch (error) {
    return authError(res, error);
  }
}
