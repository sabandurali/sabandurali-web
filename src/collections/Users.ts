import {
  ValidationError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
} from "payload";
import { PublicRequestRefusal, isAdmin } from "@/lib/payloadAccess";
import {
  preventDeletingLastAdmin,
  preventDemotingLastAdmin,
} from "@/lib/payloadDeleteGuards";
import { isHttpsDeployment } from "@/lib/payloadInfrastructure";

/** Failed logins before Payload locks an account, and for how long. */
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_TIME_MS = 10 * 60 * 1000;

/**
 * New accounts get the least privilege. The very first account is the only
 * exception: it must be an admin, otherwise nobody could ever manage users.
 */
export const assignFirstUserAdminRole: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== "create") return data;

  const { totalDocs } = await req.payload.count({
    collection: "users",
    overrideAccess: true,
    req,
  });

  return totalDocs === 0 ? { ...data, role: "admin" } : data;
};

/**
 * There is no email adapter yet (see `payload.config.ts`), so a reset email
 * would never arrive. Payload would still create a reset token and the admin
 * would claim the email was sent. Refuse the request explicitly instead; the
 * message is the same for every address, so it reveals no account.
 */
export const refusePasswordResetWithoutEmail: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (operation === "forgotPassword" && req.payload.email.name === "console") {
    throw new PublicRequestRefusal(
      "Parola sıfırlama e-postası henüz yapılandırılmadı. Parolanızı başka bir yönetici sıfırlayabilir.",
    );
  }

  return args;
};

/**
 * Payload accepts any password of three characters or more. Accounts on this
 * site can publish and delete content, so every way a password is set (first
 * registration, a new user, a profile edit, a reset) needs at least this many
 * characters and must not simply repeat the account's email address.
 */
export const MIN_PASSWORD_LENGTH = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The Turkish reason a password is refused, or null when it is acceptable. */
export function getPasswordProblem(
  password: string,
  emails: readonly string[] = [],
): string | null {
  if (Array.from(password).length < MIN_PASSWORD_LENGTH) {
    return `Parola en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  }

  const candidate = password.trim().toLowerCase();
  for (const email of emails) {
    const address = email.trim().toLowerCase();
    if (address === "") continue;
    const localPart = address.split("@")[0] ?? "";
    if (candidate === address || candidate === localPart) {
      return "Parola e-posta adresiyle aynı olamaz.";
    }
  }

  return null;
}

const PASSWORD_OPERATIONS: ReadonlySet<string> = new Set([
  "create",
  "resetPassword",
  "update",
]);

type BeforeOperationRequest =
  Parameters<CollectionBeforeOperationHook>[0]["req"];

/** The addresses a new password must not repeat: the submitted and the stored one. */
async function getAccountEmails(
  args: Record<string, unknown>,
  data: Record<string, unknown>,
  req: BeforeOperationRequest,
): Promise<string[]> {
  const emails: string[] = [];

  if (typeof data.email === "string") emails.push(data.email);
  if (typeof args.id === "string" || typeof args.id === "number") {
    const existing = await req.payload.findByID({
      collection: "users",
      depth: 0,
      disableErrors: true,
      id: args.id,
      overrideAccess: true,
      req,
    });
    if (existing !== null && typeof existing.email === "string") {
      emails.push(existing.email);
    }
  }

  return emails;
}

/**
 * Enforces the password rule wherever a password is set: create (including
 * the first registration, which runs `create`), update and reset. A refusal
 * is a field error on `password`, so the admin shows it under the field.
 */
export const enforcePasswordPolicy: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  // Each operation has its own argument type; read them as plain records.
  const operationArgs: unknown = args;
  if (!PASSWORD_OPERATIONS.has(operation) || !isRecord(operationArgs)) {
    return args;
  }

  const data = operationArgs.data;
  if (!isRecord(data) || !("password" in data)) return args;

  const { password } = data;
  // No password, or the admin form's empty "unchanged" value on update:
  // nothing is being set. Payload itself requires one on create and reset.
  if (password === undefined || password === null) return args;
  if (password === "" && operation === "update") return args;

  const problem =
    typeof password === "string"
      ? getPasswordProblem(
          password,
          await getAccountEmails(operationArgs, data, req),
        )
      : "Parola metin olmalı.";

  if (problem !== null) {
    throw new ValidationError({
      collection: "users",
      errors: [{ message: problem, path: "password" }],
    });
  }

  return args;
};

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
    // Payload's default lets any signed-in user unlock any account, so an
    // editor could reset an admin's failed-login counter between guesses and
    // probe which emails have accounts. Only admins unlock.
    unlock: ({ req }) => isAdmin(req.user),
    read: ({ req }) => {
      if (isAdmin(req.user)) return true;
      if (req.user) return { id: { equals: req.user.id } };
      return false;
    },
    update: ({ req }) => {
      if (isAdmin(req.user)) return true;
      if (req.user) return { id: { equals: req.user.id } };
      return false;
    },
  },
  admin: {
    useAsTitle: "email",
  },
  auth: {
    cookies: {
      // Lax keeps the session for a top-level navigation from another site
      // (an admin link in an email) while browsers withhold the cookie from
      // cross-site POST, PATCH and DELETE requests. Secure on every HTTPS
      // (Vercel) deployment; plain-HTTP `next start` on localhost keeps working.
      sameSite: "Lax",
      secure: isHttpsDeployment(),
    },
    lockTime: LOGIN_LOCK_TIME_MS,
    maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
  },
  fields: [
    {
      name: "role",
      type: "select",
      access: {
        update: ({ req }) => isAdmin(req.user),
      },
      admin: {
        description:
          "Editor içerik ekler ve düzenler. Admin ayrıca kullanıcıları yönetir ve içerik siler. Sistemde her zaman en az bir Admin kalır.",
      },
      defaultValue: "editor",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
      required: true,
      saveToJWT: true,
    },
  ],
  hooks: {
    beforeChange: [assignFirstUserAdminRole, preventDemotingLastAdmin],
    beforeDelete: [preventDeletingLastAdmin],
    beforeOperation: [refusePasswordResetWithoutEmail, enforcePasswordPolicy],
  },
};
