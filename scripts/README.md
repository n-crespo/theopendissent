# Scripts

## set-admin.cjs

Grants or revokes admin access. Admin access is an `admin` custom claim on the
account.

```sh
(cd scripts && npm install) # first time only

node scripts/set-admin.cjs <email>                 # grant, on the local emulator
node scripts/set-admin.cjs <email> --revoke        # revoke, on the local emulator
node scripts/set-admin.cjs <email> --prod          # grant, on production
node scripts/set-admin.cjs <email> --revoke --prod # revoke, on production
```

- The account must have signed in once, or the script exits with an error.
- A grant takes effect at the person's next sign-in.
- A revoke cuts off an open session within an hour, once its current ID token
  expires.
- The emulator needs `pnpm emulate` running.
- `--prod` needs `scripts/service-account.json`.
- Local sign-in with a non-UCLA test email needs that email in
  `WHITELISTED_EMAILS` in `functions/.env.local`.

What it does:

```text
parse arguments
if there isn't exactly one email, or a flag is unknown:
    print usage and exit

if --prod:
    clear the emulator setting
    connect to production with service-account.json
else:
    connect to the local auth emulator

user = find the account by email (trimmed, lowercased)
if no account:
    print "they must sign in once first" and exit

claims = the user's custom claims, without admin
if --revoke:
    save claims
    revoke the user's refresh tokens
else:
    save claims + admin: true

print what changed and on which target
```
