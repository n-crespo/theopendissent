/**
 * Grants or revokes the `admin` custom claim on an existing account.
 *
 * Safety:
 *   - Targets the local auth emulator by default. Pass `--prod` to change the
 *     real project.
 *   - Other custom claims on the account are preserved.
 *
 * Usage:
 *   node scripts/set-admin.cjs <email>                  # grant (emulator)
 *   node scripts/set-admin.cjs <email> --revoke         # revoke (emulator)
 *   node scripts/set-admin.cjs <email> --prod           # grant (production)
 *   node scripts/set-admin.cjs <email> --revoke --prod  # revoke (production)
 *
 * The account must have signed in at least once. Claims live in the ID token,
 * so a grant takes effect at the person's next sign-in. A revoke also revokes
 * their refresh tokens, so an open session loses access once its current ID
 * token expires (within an hour).
 *
 * Prerequisites:
 *   - cd scripts && npm install
 *   - Emulator: `pnpm emulate` running.
 *   - --prod: service-account.json in the project root (or scripts/ dir).
 */

const path = require("path");

const PROJECT_ID = "the-open-dissent-prod";
const DEFAULT_EMULATOR_HOST = "127.0.0.1:9099";

/**
 * Adds or removes the admin claim, keeping any other claims on the account.
 * Returns the affected uid.
 */
async function setAdminClaim(auth, email, { revoke = false } = {}) {
  const user = await auth.getUserByEmail(email.trim().toLowerCase());

  const { admin: _admin, ...claims } = user.customClaims ?? {};
  await auth.setCustomUserClaims(
    user.uid,
    revoke ? claims : { ...claims, admin: true },
  );
  if (revoke) await auth.revokeRefreshTokens(user.uid);

  return user.uid;
}

function loadServiceAccount() {
  for (const dir of ["..", "."]) {
    try {
      return require(path.resolve(__dirname, dir, "service-account.json"));
    } catch {
      // try the next location
    }
  }
  console.error(
    "ERROR: Could not find service-account.json in project root or scripts/ dir.",
  );
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const emails = args.filter((arg) => !arg.startsWith("--"));
  const unknown = [...flags].filter((f) => f !== "--prod" && f !== "--revoke");

  if (emails.length !== 1 || unknown.length > 0) {
    console.error(
      "Usage: node scripts/set-admin.cjs <email> [--revoke] [--prod]",
    );
    process.exit(1);
  }

  const [email] = emails;
  const revoke = flags.has("--revoke");
  const prod = flags.has("--prod");

  // decided before firebase-admin loads, which reads this variable
  if (prod) {
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  } else {
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||= DEFAULT_EMULATOR_HOST;
  }

  const admin = require("firebase-admin");
  admin.initializeApp(
    prod
      ? { credential: admin.credential.cert(loadServiceAccount()) }
      : { projectId: PROJECT_ID },
  );

  const target = prod
    ? "PRODUCTION"
    : `emulator (${process.env.FIREBASE_AUTH_EMULATOR_HOST})`;

  try {
    const uid = await setAdminClaim(admin.auth(), email, { revoke });
    console.log(
      `${revoke ? "Revoked admin from" : "Granted admin to"} ${email} (${uid}) on ${target}.`,
    );
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      console.error(
        `ERROR: No account for ${email} on ${target}. They must sign in once first.`,
      );
    } else {
      console.error(`ERROR: Could not update ${email} on ${target}:`, error);
    }
    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) main();

module.exports = { setAdminClaim };
