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

interface UserInteractions {
  hasAgreed: boolean;
  hasInterested: boolean;
  hasDisagreed: boolean;
}

interface PostInteractions {
  agreed: { [uid: string]: boolean };
  interested: { [uid: string]: boolean };
  disagreed: { [uid: string]: boolean };
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  timestamp: number | object;
  metrics: PostMetrics;
  userInteractions: PostInteractions;
}

type View = "app" | "sign-in";
type AuthUser = User | null;

// firebase things
const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Database = getDatabase(app);
const pathToPosts: DatabaseReference = ref(db, "posts");
const auth: Auth = getAuth(app);

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
    signInBtn.innerHTML = `<img src="${headIconUrl}" />`; // the original signin icon
    signInBtn.title = "Sign In";
    submitPostBtn.disabled = false; // Disable posting
    showView("app"); // Keep showing the app view, but posting is disabled
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
  console.log("rendering a buncha things!");

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
    const currentUserInteractions: UserInteractions = {
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
}

// This listener is set up ONCE and handles clicks for all current and future posts.
postList.addEventListener("click", (event: MouseEvent) => {
  // find the button that was clicked
  const button = (event.target as Element).closest(".post-btn");

  if (!button) {
    return;
  }
  if (!auth.currentUser) {
    showView("sign-in");
    return;
  }

  const postElement = button.closest(".post");
  const postID = postElement?.getAttribute("data-post-id");
  const interactionTypes = ["agreed", "disagreed", "interested"];
  const uid = auth.currentUser.uid;

  let buttonInteractionType = "";
  interactionTypes.forEach((interaction) => {
    if (button.classList.contains(interaction + "-button")) {
      buttonInteractionType = interaction;
    }
  });

  if (!buttonInteractionType || !postID) {
    console.warn("Interaction type or post ID missing");
    return;
  }

  // handle the interaction
  if (button.classList.contains("active")) {
    removeInteraction(postID, uid, buttonInteractionType);
  } else {
    addInteraction(postID, uid, buttonInteractionType);
    // ensure user can only have one interaction type active at a time
    interactionTypes.forEach((interaction) => {
      if (interaction !== buttonInteractionType) {
        removeInteraction(postID, uid, interaction);
      }
    });
  }
});

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
    } as PostInteractions,
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
