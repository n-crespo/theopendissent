// import firebase functions
import { FirebaseApp, FirebaseOptions, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import {
  Database,
  DatabaseReference,
  DataSnapshot,
  getDatabase,
  onValue,
  push,
  ref,
  serverTimestamp,
  update,
} from "firebase/database";

// local imports
import headIconUrl from "./assets/icons/head.svg";
import { getElement, timeAgo } from "./utils.ts";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBqrAeqFnJLS8GRVR1LJvlUJ_TYao-EPe0",
  authDomain: "auth.theopendissent.com",
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

interface Post {
  id: string;
  userId: string;
  content: string;
  timestamp: number | object;
  metrics: PostMetrics;
  userInteractions: PostInteractions;
}

type AuthUser = User | null;
let currentPosts: Post[] = []; // list of posts that are later rendered

// firebase things
const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Database = getDatabase(app);
const pathToPosts: DatabaseReference = ref(db, "posts");
const auth: Auth = getAuth(app);

// ui elements
// const bodyContent = getElement("body-content") as HTMLElement;
// const signInView = getElement("sign-in-view") as HTMLElement;
// const headerContent = getElement("header-content") as HTMLElement;
const headerIcon = getElement("header-icon") as HTMLElement;
const inputField = getElement("input-field") as HTMLInputElement;
const postList = getElement("post-list") as HTMLElement;
const submitPostBtn = getElement("post-btn") as HTMLButtonElement;
const googleSignInBtn = getElement("google-sign-in-btn") as HTMLButtonElement;
const signInBtn = getElement("signin-btn") as HTMLElement;
const helpBtn = getElement("help-btn") as HTMLElement;
const closeSignInButton = getElement("close-sign-in-btn") as HTMLButtonElement;
const closeModalButtons = document.querySelectorAll(".close-modal-btn");

// toggles sign-in view or signs out
signInBtn.addEventListener("click", () => {
  if (auth.currentUser) {
    signOut(auth);
  } else {
    showView("sign-in");
  }
});

googleSignInBtn.addEventListener("click", () => {
  const provider: GoogleAuthProvider = new GoogleAuthProvider();
  provider.setCustomParameters({
    login_hint: "user@g.ucla.edu",
  });

  signInWithPopup(auth, provider)
    .then((result) => {
      if (result && result.user) {
        // const credential = GoogleAuthProvider.credentialFromResult(result);
        // const token = credential?.accessToken;
        const user = result.user;
        console.log(
          "Signed in! User: " + user.displayName + " Email: " + user.email,
        );
        updateUIForAuth(user);
      }
    })
    .catch((error) => {
      // const errorCode = error.code;
      // const errorMessage = error.message;
      // const email = error.customData.email;
      // const credential = GoogleAuthProvider.credentialFromError(error);
      console.error("Sign-in failed:", error.message);

      if (error.code === "auth/internal-error") {
        alert(
          "Sorry... only @g.ucla.edu emails are allowed to sign up right now. Feel free to browse!",
        ); // "Only @ucla.edu emails are allowed to sign up." (../functions/index.ts:63)
      }
    });
});

closeModalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showView("app");
  });
});

// return to main view when logo clicker
headerIcon.addEventListener("click", () => showView("app"));
closeSignInButton.addEventListener("click", () => showView("app"));
helpBtn.addEventListener("click", () => showView("help"));
helpBtn.addEventListener("click", () => showView("help"));

// handles posting button
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

// add <CR> to submit input field
inputField.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // prevent the default action
    submitPostBtn.click();
  }
});

// handle posting logic/updating postlist/db
submitPostBtn.addEventListener("click", function () {
  if (!auth.currentUser) {
    showView("sign-in"); // redirect to sign-in page
    return;
  }

  const postContent = inputField.value;
  if (postContent.trim() === "") {
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

// UI state handler
// A more robust UI state handler for all modals
const showView = (view: "app" | "sign-in" | "help"): void => {
  const targetId = view === "app" ? null : `${view}-view`;
  const modals = document.querySelectorAll<HTMLElement>(".modal-overlay");

  modals.forEach((modal) => {
    if (modal.id === targetId) {
      modal.style.display = "flex";
      setTimeout(() => {
        modal.classList.add("visible");
      }, 10);
    } else {
      modal.classList.remove("visible");
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
    }
  });
};

function updateUIForAuth(user: AuthUser): void {
  if (user) {
    signInBtn.innerHTML = `<i class="bi bi-box-arrow-right"></i>`;
    signInBtn.title = `Signed in as ${user.email?.split("@")[0]}`;
    signInBtn.classList.add("signed-in");
    showView("app");
  } else {
    signInBtn.innerHTML = `<img src="${headIconUrl}" />`;
    signInBtn.title = "Sign In";
    signInBtn.classList.remove("signed-in");
    showView("app");
  }
}

// shuffle an array in place so that all permutations are equally possible
function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

let shuffledPostIds: string[] = [];

function render(posts: Post[]): void {
  const postsMap = new Map<string, Post>();
  for (const post of posts) {
    postsMap.set(post.id, post);
  }

  const incomingPostIds = posts.map((p) => p.id);

  if (shuffledPostIds.length === 0 && incomingPostIds.length > 0) {
    shuffledPostIds = shuffleArray(incomingPostIds);
  }

  // add new post IDs that haven't been added yet
  for (const postId of incomingPostIds) {
    if (!shuffledPostIds.includes(postId)) {
      shuffledPostIds.unshift(postId); // Append new posts to the end of list
    }
  }

  // filter the fixed ID list to only include posts that currently exist.
  const finalOrderIds = shuffledPostIds.filter((id) => postsMap.has(id));

  let listItems = "";
  for (const postId of finalOrderIds) {
    const post = postsMap.get(postId)!;

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
  <div class="post-header">
    <div class="post-avatar">
      <i class="bi bi-person-fill"></i>
    </div>
    <div class="post-user-info">
      <span class="username" title=${post.userId}>${currentUserId == post.userId ? "You" : post.userId.substring(0, 10) + "…"}</span>
      <span class="timestamp">${formattedTime}</span>
    </div>
  </div>
  <p class="post-content">${post.content}</p>
  <div class="post-interaction-buttons">
    <button class="post-btn agreed-button ${
      currentUserInteractions.hasAgreed ? "active" : ""
    }">
      <div class="btn-content">
        <i class="bi bi-check-square"></i>
        <span class="count">${metrics.agreedCount}</span>
      </div>
    </button>
    <button class="post-btn interested-button ${
      currentUserInteractions.hasInterested ? "active" : ""
    }">
      <div class="btn-content">
        <i class="bi bi-fire"></i>
        <span class="count">${metrics.interestedCount}</span>
      </div>
    </button>
    <button class="post-btn disagreed-button ${
      currentUserInteractions.hasDisagreed ? "active" : ""
    }">
      <div class="btn-content">
        <i class="bi bi-x-square"></i>
        <span class="count">${metrics.disagreedCount}</span>
      </div>
    </button>
  </div>
</div>
`;
  }
  postList.innerHTML = listItems;
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

onValue(pathToPosts, function (snapshot) {
  const newPostsArray = processPostsSnapshot(snapshot);
  currentPosts = newPostsArray; // replace old posts with new ones

  if (currentPosts.length > 0) {
    render(currentPosts);
  } else {
    postList.innerHTML = "<p>No posts yet!</p>";
  }
});

// preserve log in between session
onAuthStateChanged(auth, (user) => {
  updateUIForAuth(user);
  if (currentPosts.length > 0) {
    render(currentPosts);
  } else {
    postList.innerHTML = `<div style="text-align: center">Loading posts...</div>`;
  }
});
