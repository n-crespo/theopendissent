// import firebase functions
import { FirebaseApp, FirebaseOptions, initializeApp } from "firebase/app";
import {
  Database,
  DatabaseReference,
  DataSnapshot,
  // get,
  getDatabase,
  // increment,
  onValue,
  push,
  ref,
  // runTransaction,
  serverTimestamp,
  set,
  update,
  // remove,
} from "firebase/database";
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  // browserPopupRedirectResolver,
  // signInWithRedirect,
  // getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
  // AuthCredential,
} from "firebase/auth";

// local imports
import headIconUrl from "./assets/icons/head.svg";
import { getElement, timeAgo } from "./utils.ts";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBqrAeqFnJLS8GRVR1LJvlUJ_TYao-EPe0",
  authDomain: "test-app-d0afd.firebaseapp.com",
  databaseURL: "https://test-app-d0afd-default-rtdb.firebaseio.com",
  projectId: "test-app-d0afd",
  storageBucket: "test-app-d0afd.firebasestorage.app",
  messagingSenderId: "772131437162",
  appId: "1:772131437162:web:29b3407e82adeb28942813",
};

interface PostMetrics {
  agreedCount: number;
  disagreedCount: number;
  interestedCount: number;
}

interface CurrentUserInteractions {
  hasAgreed: boolean;
  hasInterested: boolean;
  hasDisagreed: boolean;
}

interface PostUserInteractions {
  agreed: { [uid: string]: boolean };
  interested: { [uid: string]: boolean };
  disagreed: { [uid: string]: boolean };
}

export interface Post {
  id: string; // The key from the database (e.g., "-Mbq...")
  userId: string;
  content: string; // Assuming 'postContent' from DB is mapped to 'content' here
  timestamp: number | object; // serverTimestamp returns an object initially, number after sync
  metrics: PostMetrics;
  userInteractions: PostUserInteractions;
}

type View = "app" | "sign-in";
type AuthUser = User | null;

// firebase things
const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Database = getDatabase(app);
const pathToPosts: DatabaseReference = ref(db, "posts"); // create a reference (required)
const auth: Auth = getAuth(app); // Get Auth service
// const usersRefInDB = ref(database, "users"); // create a reference (required)
// const googleProvider = new GoogleAuthProvider(); // Google Auth provider

// ui elements
const bodyContent = getElement("body-content") as HTMLElement;
const signInView = getElement("sign-in-view") as HTMLElement;
const headerLogo = getElement("header-icon") as HTMLElement;
const inputField = getElement("input-field") as HTMLInputElement;
const postList = getElement("post-list") as HTMLElement;
const submitPostBtn = getElement("post-btn") as HTMLButtonElement;
const signInBtn = getElement("signin-btn") as HTMLButtonElement;
const googleSignInBtn = getElement("google-sign-in-btn") as HTMLButtonElement;
const closeSignInBtn = getElement("close-sign-in-btn") as HTMLButtonElement;

let currentPosts: Post[] = []; // list of posts that are later rendered

// UI state handler
const showView = (view: View): void => {
  bodyContent.style.display = "none";
  signInView.style.display = "none";

  if (view === "app") {
    bodyContent.style.display = "block";
  } else if (view === "sign-in") {
    signInView.style.display = "block";
  }
};

/**
 * Updates the UI based on the user's authentication state.
 * @param user The current Firebase User object or null if signed out.
 */
export const updateUI = (user: AuthUser): void => {
  if (user) {
    signInBtn.innerHTML = `Sign Out:<br />(${
      user.email?.split("@")[0]
    })<br /> ${getAuth(app)?.currentUser?.uid.substring(0, 10)} `;
    submitPostBtn.disabled = false;
    showView("app");
  } else {
    signInBtn.innerHTML = `<img src="${headIconUrl}" />`; // The original sign-in icon
    signInBtn.title = "Sign In";
    submitPostBtn.disabled = false; // Disable posting
    showView("app"); // Keep showing the app view, but posting is disabled (or show a public view)
  }
};

// toggles sign-in view or signs out
signInBtn.addEventListener("click", function (): void {
  if (auth.currentUser) {
    signOut(auth);
  } else {
    showView("sign-in");
  }
});

googleSignInBtn.addEventListener("click", () => {
  const provider: GoogleAuthProvider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      if (result && result.user) {
        // const credential = GoogleAuthProvider.credentialFromResult(result);
        // const token = credential?.accessToken;
        const user = result.user;
        console.log(
          "Signed in! User: " + user.displayName + " Email: " + user.email,
        );
        updateUI(user);

        const newUser = { email: user.email, displayName: user.displayName };
        const userRefInDB = ref(db, "users/" + user.uid);
        set(userRefInDB, newUser);
      }
    })
    .catch((error) => {
      // const errorCode = error.code;
      // const errorMessage = error.message;
      // const email = error.customData.email;
      // const credential = GoogleAuthProvider.credentialFromError(error);
      console.log(error);
    });
});

closeSignInBtn.addEventListener("click", () => showView("app"));

// preserve log in between session
onAuthStateChanged(auth, (user) => {
  updateUI(user);
  if (currentPosts.length > 0) {
    render(currentPosts);
  } else {
    postList.innerHTML = `<div style="text-align: center">Loading posts...</div>`;
  }
});

function render(posts: Post[]): void {
  let listItems = "";

  for (const post of posts) {
    const postTime: Date = new Date(
      typeof post.timestamp === "number" ? post.timestamp : 0,
    );
    const formattedTime: string = timeAgo(postTime, "en");

    // grab the uid of the current user
    const currentUserId: string | null = auth.currentUser
      ? auth.currentUser.uid
      : null;

    // check if current user has interacted
    const currentUserInteractions: CurrentUserInteractions = {
      hasAgreed: post.userInteractions?.agreed?.[currentUserId!],
      hasInterested: post.userInteractions?.interested?.[currentUserId!],
      hasDisagreed: post.userInteractions?.disagreed?.[currentUserId!],
    };

    const metrics = post.metrics;

    listItems += `
<div class="post" data-post-id="${post.id}">
  <div id="post-header">
    <div>
      <i class="bi bi-person-fill"></i>${post.userId.substring(0, 10)}
    </div>
    <div>
      Posted ${formattedTime}
    </div>
  </div>
  <p>${post.content}</p>
  <div id="post-btns">
    <button class="post-btn agreed-button ${
      currentUserInteractions.hasAgreed ? "active" : ""
    }">
      <i class="bi bi-check-square"></i>
      <span class="count">${metrics.agreedCount}</span>
    </button>
    <button class="post-btn interested-button ${
      currentUserInteractions.hasInterested ? "active" : ""
    }">
      <i class="bi bi-fire"></i>
      <span class="count">${metrics.interestedCount}</span>
    </button>
    <button class="post-btn disagreed-button ${
      currentUserInteractions.hasDisagreed ? "active" : ""
    }">
      <i class="bi bi-x-square"></i>
      <span class="count">${metrics.disagreedCount}</span>
    </button>
  </div>
</div>
    `;
  }
  postList.innerHTML = listItems;

  const interactButtons: NodeListOf<Element> =
    document.querySelectorAll(".post-btn");
  interactButtons.forEach((button: Element) => {
    button.addEventListener("click", function (this: HTMLButtonElement): void {
      if (!auth.currentUser) {
        showView("sign-in");
        return;
      }

      const postElement: Element | null = this.closest(".post");
      const postID = postElement?.getAttribute("data-post-id");
      const interactionTypes = ["agreed", "disagreed", "interested"];
      const uid: string = auth.currentUser.uid;

      // figure out which kind of button this is exactly
      let buttonInteractionType: string = "";
      interactionTypes.forEach((interaction) => {
        if (this.classList.contains(interaction + "-button")) {
          buttonInteractionType = interaction;
        }
      });

      // check for edge case errors
      if (!buttonInteractionType || !postID || !auth.currentUser) {
        console.warn("Interaction type or post ID missing");
        return;
      }

      // HACK: this should probably happen on server side
      if (this.classList.contains("active")) {
        removeInteraction(postID, uid, buttonInteractionType);
      } else {
        addInteraction(postID, uid, buttonInteractionType);
        interactionTypes.forEach((interaction) => {
          if (interaction != buttonInteractionType) {
            removeInteraction(postID, uid, interaction);
          }
        });
      }
    });
  });
}

/**
 * Processes a Firebase DataSnapshot and returns a sorted array of Post objects.
 *
 * @param snapshot The DataSnapshot received from a Firebase listener.
 * @returns A new array of Post objects, sorted with the newest first.
 */
function processPostsSnapshot(snapshot: DataSnapshot): Post[] {
  if (!snapshot.exists()) {
    console.log("Snapshot doesn't exist. Returning empty posts array.");
    return [];
  }

  const postsObject = snapshot.val();

  const postsArray = Object.entries(postsObject).map(
    ([postId, postData]: [string, any]) => {
      if (
        !postData ||
        typeof postData.postContent !== "string" ||
        typeof postData.userId !== "string"
      ) {
        return null;
      }

      // 4. Construct a clean Post object with default fallbacks.
      return {
        id: postId,
        userId: postData.userId,
        content: postData.postContent,
        timestamp: postData.timestamp || 0,
        metrics: postData.metrics || {
          agreedCount: 0,
          disagreedCount: 0,
          interestedCount: 0,
        },
        userInteractions: postData.userInteractions || {
          agreed: {},
          interested: {},
          disagreed: {},
        },
      };
    },
  );

  const validPosts = postsArray.filter((post): post is Post => post !== null);

  return validPosts;
}

onValue(pathToPosts, function (snapshot) {
  const newPostsArray = processPostsSnapshot(snapshot);
  currentPosts = newPostsArray; // replace old posts with new ones

  if (currentPosts.length > 0) {
    render(currentPosts);
  } else {
    postList.innerHTML = "<p>No posts yet!</p>";
  }
});

// add <CR> to submit input field
inputField.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // prevent the default action
    submitPostBtn.click();
  }
});

// return to main view when logo clicker
headerLogo.addEventListener("click", function () {
  showView("app");
});

// handle posting logic/updating postlist/db
submitPostBtn.addEventListener("click", function () {
  const postContent = inputField.value;

  // don't allow users that are not signed in to posst
  if (!auth.currentUser || postContent.trim() === "") {
    if (!auth.currentUser) {
      showView("sign-in"); // redirect to sign-in page
    }
    return;
  }

  const newPost = {
    userId: auth.currentUser.uid,
    postContent: postContent,
    timestamp: serverTimestamp(),
    metrics: {
      agreedCount: 0,
      disagreedCount: 0,
      interestedCount: 0,
    } as PostMetrics,
    interactions: {
      agreed: {},
      interested: {},
      disagreed: {},
    } as PostUserInteractions,
    //   agreed: { "uid": true },
  };

  push(pathToPosts, newPost);
  inputField.value = "";
});

function getInteractionPaths(postID: string, uid: string, interaction: string) {
  return {
    user: `users/${uid}/postInteractions/${interaction}/${postID}`,
    post: `posts/${postID}/userInteractions/${interaction}/${uid}`,
    metrics: `posts/${postID}/metrics/${interaction}Count`,
  };
}

// note: incrementing of interaction counts is done on server side
function updateInteraction(
  postID: string,
  uid: string,
  interaction: string,
  value: boolean | null,
) {
  const paths = getInteractionPaths(postID, uid, interaction);
  const updates = {
    [paths.user]: value,
    [paths.post]: value,
  };
  return update(ref(db), updates);
}

function addInteraction(postID: string, uid: string, interaction: string) {
  updateInteraction(postID, uid, interaction, true);
}

function removeInteraction(postID: string, uid: string, interaction: string) {
  updateInteraction(postID, uid, interaction, null);
}
