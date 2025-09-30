import { GoogleAuthProvider } from "firebase/auth";

const provider = new GoogleAuthProvider();

provider.addScope("https://www.googleapis.com/auth/contacts.readonly");

import { getAuth } from "firebase/auth";

const auth = getAuth();
auth.languageCode = "it";
auth.useDeviceLanguage();
