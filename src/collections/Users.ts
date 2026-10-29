import { pbkdf2, randomBytes } from "node:crypto";
import {
  AuthenticationError,
  ValidationError,
  type CollectionAfterErrorHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type Where,
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

/**
 * A bulk operation's `where`: field conditions (records) and `and` / `or`
 * lists of nested conditions.
 */
function isWhere(value: unknown): value is Where {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (condition) =>
        isRecord(condition) ||
        (Array.isArray(condition) && condition.every(isWhere)),
    )
  );
}

type BeforeOperationRequest =
  Parameters<CollectionBeforeOperationHook>[0]["req"];

/**
 * The addresses a new password must not repeat: the submitted one and the
 * stored one of every account the operation changes.
 *
 * `beforeOperation` runs before Payload's access check, so both lookups use
 * the caller's own access: a Local API call that overrides access (a script,
 * no user) reads every account; a REST or admin call reads only the accounts
 * that caller may see. A caller without read access gets no address here,
 * the password is compared with nothing private and the update itself is
 * then refused with 403. The check therefore cannot confirm a guessed email
 * address of an account the caller could not update anyway.
 */
async function getAccountEmails(
  args: Record<string, unknown>,
  data: Record<string, unknown>,
  req: BeforeOperationRequest,
): Promise<string[]> {
  const emails: string[] = [];

  if (typeof data.email === "string") emails.push(data.email);
  const overrideAccess = args.overrideAccess === true;
  if (typeof args.id === "string" || typeof args.id === "number") {
    const existing = await req.payload.findByID({
      collection: "users",
      depth: 0,
      disableErrors: true,
      id: args.id,
      overrideAccess,
      req,
    });
    if (existing !== null && typeof existing.email === "string") {
      emails.push(existing.email);
    }
  } else if (isWhere(args.where)) {
    const matching = await req.payload.find({
      collection: "users",
      depth: 0,
      disableErrors: true,
      overrideAccess,
      pagination: false,
      req,
      where: args.where,
    });
    for (const account of matching.docs) {
      if (typeof account.email === "string") emails.push(account.email);
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

/**
 * Parameters of Payload's current password hash (PBKDF2-SHA256, 600 000
 * iterations, 32 bytes; `generatePasswordSaltHash` in Payload).
 */
const PASSWORD_HASH_ITERATIONS = 600_000;
const PASSWORD_HASH_KEY_LENGTH = 32;

/** One PBKDF2 computation that costs as much as checking a real password. */
export function computeDecoyPasswordHash(password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    randomBytes(32, (saltError, salt) => {
      if (saltError) {
        reject(saltError);
        return;
      }
      pbkdf2(
        password,
        salt.toString("hex"),
        PASSWORD_HASH_ITERATIONS,
        PASSWORD_HASH_KEY_LENGTH,
        "sha256",
        (hashError) => (hashError ? reject(hashError) : resolve()),
      );
    });
  });
}

/** True while Payload refuses every login of the account (`lockUntil`). */
export function isLoginLocked(
  lockUntil: unknown,
  now: Date = new Date(),
): boolean {
  if (typeof lockUntil !== "string" && !(lockUntil instanceof Date)) {
    return false;
  }
  const until = new Date(lockUntil).getTime();
  return Number.isFinite(until) && until > now.getTime();
}

/**
 * Payload hashes the submitted password only for an existing, unlocked
 * account: an unknown address or a locked account is refused before PBKDF2
 * runs, and the faster answer tells which addresses have an account. This
 * `login` hook spends the same hash on those two paths, so every refusal
 * takes about as long as a wrong password.
 */
export function createLoginTimingEqualizer(
  computeHash: (password: string) => Promise<void> = computeDecoyPasswordHash,
): CollectionBeforeOperationHook {
  return async ({ args, operation, req }) => {
    if (operation !== "login") return args;
    const loginArgs: unknown = args;
    if (!isRecord(loginArgs) || !isRecord(loginArgs.data)) return args;

    const { email, password } = loginArgs.data;
    if (typeof email !== "string" || typeof password !== "string") {
      return args;
    }
    if (password.trim() === "") return args;

    const account: unknown = await req.payload.db.findOne({
      collection: "users",
      req,
      where: { email: { equals: email.toLowerCase().trim() } },
    });
    if (!isRecord(account) || isLoginLocked(account.lockUntil)) {
      await computeHash(password);
    }

    return args;
  };
}

export const equalizeLoginTiming = createLoginTimingEqualizer();

/**
 * Payload answers a locked account with "This user is locked due to having
 * too many failed login attempts", which an unknown address never gets: five
 * wrong passwords would reveal whether an address has an admin account.
 * REST and admin responses get the same 401 as a wrong email or password
 * instead. The lock itself still applies, Payload still logs the original
 * error, and an admin still sees and clears the lock on the account.
 */
export const hideLockedAccountOnLogin: CollectionAfterErrorHook = ({
  error,
  req,
}) => {
  if (error.name !== "LockedAuth") return;

  const refusal = new AuthenticationError(req.t);
  return {
    response: { errors: [{ message: refusal.message }] },
    status: refusal.status,
  };
};

/**
 * Shown under the role field. Media is the only collection an editor may
 * delete from (`Media.access.delete`, admin-help-guide.ts); a test keeps the
 * text, the access rules and the admin guide in agreement.
 */
export const USER_ROLE_DESCRIPTION =
  "Editor içerik ekler ve düzenler, kullanılmayan Media dosyalarını silebilir. Admin ayrıca kullanıcıları yönetir ve diğer içerikleri siler. Sistemde her zaman en az bir Admin kalır.";

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
        description: USER_ROLE_DESCRIPTION,
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
    afterError: [hideLockedAccountOnLogin],
    beforeChange: [assignFirstUserAdminRole, preventDemotingLastAdmin],
    beforeDelete: [preventDeletingLastAdmin],
    beforeOperation: [
      refusePasswordResetWithoutEmail,
      enforcePasswordPolicy,
      equalizeLoginTiming,
    ],
  },
};
