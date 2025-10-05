// import firebase functions
import { initializeApp, FirebaseOptions, FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  onValue,
  increment,
  serverTimestamp,
  set,
  Database,
  DatabaseReference,
  // update,
  // remove,
} from "firebase/database";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User,
  Auth,
  // AuthCredential,
} from "firebase/auth";

// local imports
import headIconUrl from "./assets/icons/head.svg";
import { getElement } from "./utils.ts";

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

interface PostInteractions {
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
  interactions: PostInteractions;
}

type View = "app" | "sign-in";
type AuthUser = User | null;

// firebase things
const app: FirebaseApp = initializeApp(firebaseConfig);
const database: Database = getDatabase(app);
const postsRefInDB: DatabaseReference = ref(database, "posts"); // create a reference (required)
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
    signInBtn.innerHTML = `Sign Out:<br />(${user.email?.split("@")[0]})<br /> ${getAuth(app)?.currentUser?.uid.substring(0, 10)} `;
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
      const user: User = result.user;
      const newUser = {
        email: user.email,
        displayName: user.displayName,
      };
      const uid: string | undefined = auth.currentUser?.uid;
      if (uid) {
        const userRefInDB: DatabaseReference = ref(database, "users/" + uid);
        set(userRefInDB, newUser);
      }
    })
    .catch((error) => {
      console.log(error);
      if (error.message) {
        console.error("Google Sign-In Error:", error.message);
      }
    });
});

closeSignInBtn.addEventListener("click", () => showView("app"));

// Auth state listener
onAuthStateChanged(auth, (user: AuthUser) => {
  updateUI(user);
});

function render(posts: Post[]): void {
  let listItems = "";

  for (const post of posts) {
    const postTime: Date = new Date(
      typeof post.timestamp === "number" ? post.timestamp : 0,
    );
    const formattedTime: string = postTime.toLocaleString(); // Format the date and time for display

    // grab the uid of the current user
    const currentUserId: string | null = auth.currentUser
      ? auth.currentUser.uid
      : null;

    // check if user has interacted
    const hasAgreed: boolean = Boolean(
      post.interactions?.agreed?.[currentUserId!],
    );
    const hasInteresting = Boolean(
      post.interactions?.interested?.[currentUserId!],
    );
    const hasDisagreed = Boolean(
      post.interactions?.disagreed?.[currentUserId!],
    );

    const agreedCount: number = post.metrics?.agreedCount || 0;
    const interestingCount: number = post.metrics?.interestedCount || 0;
    const disagreedCount: number = post.metrics?.disagreedCount || 0;

    listItems += `
<div class="post" data-post-id="${post.id}">
  <div id="user-icon-id">
    <i class="bi bi-person-fill"></i> ${post.userId.substring(0, 10)}
  </div>
  <p class="timestamp">${formattedTime}</p>
  <p>${post.content}</p>
  <div id="post-btns">
    <button class="post-btn agreed-button" ${hasAgreed ? "active" : ""}>
      <i class="bi bi-check-square"></i>
      <span class="count">${agreedCount}</span>
    </button>
    <button class="post-btn interested-button" ${hasInteresting ? "active" : ""}>
      <i class="bi bi-fire"></i>
      <span class="count">${interestingCount}</span>
    </button>
    <button class="post-btn disagreed-button" ${hasDisagreed ? "active" : ""}>
      <i class="bi bi-x-square"></i>
      <span class="count">${disagreedCount}</span>
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
      const currentPostID = postElement?.getAttribute("data-post-id");
      const interactionTypes = ["agreed", "disagreed", "interested"];
      let currentInteraction = "";

      // figure out which kind of button this is exactly
      interactionTypes.forEach((interaction) => {
        console.log("checking: " + interaction);
        if (this.classList.contains(interaction + "-button")) {
          currentInteraction = interaction;
        }
      });

      // check for edge case errors
      if (!currentInteraction || !currentPostID || !auth.currentUser) {
        console.warn("Interaction type or post ID missing");
        return;
      }

      const uid: string = auth.currentUser.uid;

      // update user's interaction history
      const userInteractionRef = ref(
        database,
        `users/${uid}/postInteractions/${currentInteraction}/${currentPostID}`,
      );
      set(userInteractionRef, true);

      // update post's list of interacted users
      const postInteractionRef = ref(
        database,
        `posts/${currentPostID}/userInteractions/${currentInteraction}/${uid}`,
      );
      set(postInteractionRef, true);

      // update interaction metrics counter for post
      const postMetricRef = ref(
        database,
        `posts/${currentPostID}/metrics/${currentInteraction}Count`,
      );
      set(postMetricRef, increment(1));

      // (toggle 'active' class)
      // this.classList.toggle("active");
    });
  });
}

onValue(postsRefInDB, function (snapshot) {
  if (snapshot.exists()) {
    const postsObject = snapshot.val();
    const currentPosts: Post[] = [];

    for (const postId in postsObject) {
      if (Object.prototype.hasOwnProperty.call(postsObject, postId)) {
        const postData = postsObject[postId];
        if (
          postData &&
          typeof postData.postContent === "string" &&
          typeof postData.userId === "string"
        ) {
          currentPosts.unshift({
            id: postId,
            userId: postData.userId,
            content: postData.postContent,
            timestamp: postData.timestamp,
            metrics: postData.metrics || {
              agreedCount: 0,
              disagreedCount: 0,
              interestedCount: 0,
            },
            interactions: postData.interactions || {
              agreed: {},
              interested: {},
              disagreed: {},
            },
          });
        }
      }
    }
    render(currentPosts);
  } else {
    console.log("snapshot doesn't exist...");
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

  push(postsRefInDB, newPost);
  inputField.value = "";
});
