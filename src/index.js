// import firebase functions
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
const usersRefInDB = ref(database, "user"); // create a reference (required)
const auth = getAuth(app); // Get Auth service
const googleProvider = new GoogleAuthProvider(); // Google Auth provider

// ui elements
const bodyContent = document.getElementById("body-content"); // main feed
const signInView = document.getElementById("sign-in-view"); // hidden sign in page
const headerLogo = document.getElementById("header-icon");
const inputField = document.getElementById("input-field");
const postList = document.getElementById("post-list");
const submitPostBtn = document.getElementById("post-btn");
const signInBtn = document.getElementById("signin-btn");
const googleSignInBtn = document.getElementById("google-sign-in-btn");
const closeSignInBtn = document.getElementById("close-sign-in-btn");

// UI state handler
const showView = (view) => {
  bodyContent.style.display = "none";
  signInView.style.display = "none";

  if (view === "app") {
    bodyContent.style.display = "block";
  } else if (view === "sign-in") {
    signInView.style.display = "block";
  }
};

const updateUI = (user) => {
  console.log("calling update ui");
  if (user) {
    signInBtn.innerHTML = `Sign Out:<br />(${user.email.split("@")[0]}) `;
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
  signInWithPopup(auth, googleProvider).catch((error) => {
    console.error("Google Sign-In Failed:", error.message);
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
<div id="post" data-post-id="${post.id}">
  <div id="user-icon-id">
    <i class="bi bi-person-fill"></i> ${post.userId.substring(0, 5)}
  </div>
  <p class="timestamp">${formattedTime}</p>
  <p>${post.content}</p>
  <div id="post-btns">
    <button class="post-btn agree-button" ${hasAgreed ? "active" : ""}>
      <i class="bi bi-check-square"></i>
      <span class="count">${agreedCount}</span>
    </button>
    <button class="post-btn interesting-button" ${hasInteresting ? "active" : ""}>
      <i class="bi bi-fire"></i>
      <span class="count">${interestingCount}</span>
    </button>
    <button class="post-btn disagree-button" ${hasDisagreed ? "active" : ""}>
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
      // (toggle 'active' class)
      // this.classList.toggle("active");
      // if (this.classList.contains('agree-button')) {...}
      if (!auth.currentUser) {
        showView("sign-in");
      } else {
        // Determine interaction type
        let interactionType = "";
        if (this.classList.contains("agree-button")) {
          interactionType = "agreed";
        } else if (this.classList.contains("disagree-button")) {
          interactionType = "disagreed";
        } else if (this.classList.contains("interested-button")) {
          interactionType = "interested";
        }
        // Get current post ID (assume it's available as currentPostID)
        // FIX: link postID with interaction button
        // const currentPostID = window.currentPostID;
        if (!interactionType || !currentPostID) {
          console.warn("Interaction type or post ID missing");
          return;
        }
        const userRef = ref(
          database,
          `users/${user.uid}/interactionsHistory/${interactionType}/${currentPostID}`,
        );
        set(userRef, true);
      }
    });
  });
}

onValue(postsRefInDB, function (snapshot) {
  if (snapshot.exists()) {
    const postsObject = snapshot.val();
    const currentPosts = [];

    for (let postId in postsObject) {
      console.log(postId);
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
      disagreeCount: 0,
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

  const newPostRef = push(postsRefInDB, newPost);
  // const postId = newPostRef.key; // This is the POSTID (e.g., "-Mbq...")
  // console.log("key: " + postId);
  // newPostRef.update({
  //   id: postId,
  // });

  inputField.value = "";
});
