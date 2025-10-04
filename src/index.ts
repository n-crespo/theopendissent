// import firebase functions
import { getElement } from "./utils";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  onValue,
  serverTimestamp,
  update,
  set,
  remove,
  increment,
} from "firebase/database";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBqrAeqFnJLS8GRVR1LJvlUJ_TYao-EPe0",
  authDomain: "test-app-d0afd.firebaseapp.com",
  databaseURL: "https://test-app-d0afd-default-rtdb.firebaseio.com",
  projectId: "test-app-d0afd",
  storageBucket: "test-app-d0afd.firebasestorage.app",
  messagingSenderId: "772131437162",
  appId: "1:772131437162:web:29b3407e82adeb28942813",
};

// firebase things
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const postsRefInDB = ref(database, "posts"); // create a reference (required)
// const usersRefInDB = ref(database, "users"); // create a reference (required)
const auth = getAuth(app); // Get Auth service
// const googleProvider = new GoogleAuthProvider(); // Google Auth provider

// ui elements
const bodyContent = getElement("body-content");
const signInView = getElement("sign-in-view");
const headerLogo = getElement("header-icon");
const inputField = getElement("input-field");
const postList = getElement("post-list");
const submitPostBtn = getElement("post-btn");
const signInBtn = getElement("signin-btn");
const googleSignInBtn = getElement("google-sign-in-btn");
const closeSignInBtn = getElement("close-sign-in-btn");

// UI state handler
type View = "app" | "sign-in";
const showView = (view: View) => {
  bodyContent.style.display = "none";
  signInView.style.display = "none";

  if (view === "app") {
    bodyContent.style.display = "block";
  } else if (view === "sign-in") {
    signInView.style.display = "block";
  }
};

const updateUI = (user) => {
  if (user) {
    signInBtn.innerHTML = `Sign Out:<br />(${user.email.split("@")[0]})<br /> ${getAuth(app).currentUser.uid.substring(0, 10)} `;
    submitPostBtn.disabled = false;
    showView("app");
  } else {
    signInBtn.innerHTML = `<img src="src/assets/head.svg" />`; // The original sign-in icon
    signInBtn.title = "Sign In";
    submitPostBtn.disabled = false; // Disable posting
    showView("app"); // Keep showing the app view, but posting is disabled (or show a public view)
  }
};

// toggles sign-in view or signs out
signInBtn.addEventListener("click", function () {
  if (auth.currentUser) {
    signOut(auth);
  } else {
    showView("sign-in");
  }
});

googleSignInBtn.addEventListener("click", () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      const newUser = {
        email: user.email,
        displayName: user.displayName,
      };
      const uid = auth.currentUser.uid;
      const userRefInDB = ref(database, "users/" + uid); // create a reference (required)
      set(userRefInDB, newUser);
    })
    .catch((error) => {
      // Handle Errors here.
      console.log(error);
      console.error("Google Sign-In Error:", error.message);
    });
});

closeSignInBtn.addEventListener("click", () => showView("app"));

onAuthStateChanged(auth, (user) => {
  // console.log("changing state due to auth");
  updateUI(user);
});

// HACK: somewhat stupidly render all posts
function render(posts) {
  let listItems = "";
  for (let i = 0; i < posts.length; i++) {
    let post = posts[i];
    const postTime = new Date(post.timestamp);
    const formattedTime = postTime.toLocaleString(); // Format the date and time for display

    // grab the uid of the current user
    const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
    const hasAgreed = post.interactions?.agreed?.[currentUserId];
    const hasInteresting = post.interactions?.interesting?.[currentUserId];
    const hasDisagreed = post.interactions?.disagreed?.[currentUserId];

    const agreedCount = post.metrics?.agreedCount || 0;
    const interestingCount = post.metrics?.interestingCount || 0;
    const disagreedCount = post.metrics?.disagreedCount || 0;

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

  const interactButtons = document.querySelectorAll(".post-btn");
  interactButtons.forEach((button) => {
    button.addEventListener("click", function (event) {
      if (!auth.currentUser) {
        showView("sign-in");
      } else {
        const postElement = this.closest(".post");
        const currentPostID = postElement.getAttribute("data-post-id");
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
        if (!currentInteraction || !currentPostID) {
          console.warn("Interaction type or post ID missing");
          return;
        }

        const uid = auth.currentUser.uid;
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
          `posts/${currentPostID}/metrics/${currentInteraction}count/${uid}`,
        );
        set(postMetricRef, true);

        // (toggle 'active' class)
        // this.classList.toggle("active");
      }
    });
  });
}

onValue(postsRefInDB, function (snapshot) {
  if (snapshot.exists()) {
    const postsObject = snapshot.val();
    const currentPosts = [];

    for (let postId in postsObject) {
      if (postsObject.hasOwnProperty(postId)) {
        const post = postsObject[postId];
        if (
          post &&
          post.hasOwnProperty("postContent") &&
          post.hasOwnProperty("userId")
        ) {
          currentPosts.unshift({
            id: postId,
            userId: post.userId,
            content: post.postContent,
            timestamp: post.timestamp,
            metrics: post.metrics,
            interactions: post.interactions,
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
    },

    interactions: {
      agreed: {},
      interested: {},
      disagreed: {},
    },
    // Will store UIDs: { 'uid1': true, 'uid2': true }
    //   agreed: { "placeholder-id": true },
    //   interesting: { "placeholder-id": true },
    //   disagreed: { "placeholder-id": true },
    // },
  };

  push(postsRefInDB, newPost);
  // const postId = newPostRef.key; // This is the POSTID (e.g., "-Mbq...")
  // console.log("key: " + postId);
  // newPostRef.update({
  //   id: postId,
  // });

  inputField.value = "";
});

const updateInteraction = (interactionType: string) => {
  bodyContent.style.display = "none";
  signInView.style.display = "none";

  if (view === "app") {
    bodyContent.style.display = "block";
  } else if (view === "sign-in") {
    signInView.style.display = "block";
  }
};
