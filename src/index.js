// import firebase functions
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  onValue,
  serverTimestamp,
  // remove,
} from "firebase/database";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth"; // <-- NEW: Import Auth services

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
const auth = getAuth(app); // Get Auth service
const googleProvider = new GoogleAuthProvider(); // Google Auth provider

// ui elements
const bodyContent = document.getElementById("body-content"); // main feed
const signInView = document.getElementById("sign-in-view"); // hidden sign in page

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
    // User is signed in (show sign out option)
    // signInBtn.innerHTML = `icon: <i class="fa-solid fa-right-from-bracket"></i>`;
    signInBtn.innerHTML = `Sign Out (${user.email})`;
    console.log(user.email);
    submitPostBtn.disabled = false; // Allow posting
    showView("app"); // Show the main content
  } else {
    // User is signed out
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
  console.log("changing state due to auth");
  updateUI(user);
});

// somewhat stupidly render all posts
function render(posts) {
  let listItems = "";
  for (let i = 0; i < posts.length; i++) {
    const postTime = new Date(posts[i].timestamp);
    const formattedTime = postTime.toLocaleString(); // Format the date and time for display
    listItems += `
<div id="post">
  <div id="user-icon-id"> 👤 ${posts[i].userId.substring(0, 5)} </div>
  <p class="timestamp">${formattedTime}</p>
  <p>${posts[i].content}</p>
</div>
  <div id="post-buttons">
    <button class="post-button agree-button">
      <i class="bi bi-check-square"></i>
    </button>
    <button class="post-button interesting-button">
      <i class="bi bi-fire"></i>
    </button>
    <button class="post-button disagree-button">
      <i class="bi bi-x-square"></i>
    </button>
</div>
    `;
  }
  postList.innerHTML = listItems;
}

// HACK: render database status on change
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
          currentPosts.push({
            userId: post.userId,
            content: post.postContent,
            likes: 0,
            timestamp: post.timestamp,
          });
        }
      }
    }
    render(currentPosts.reverse());
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

headerLogo.addEventListener("click", function () {
  showView("app");
});

// submit input field
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
    likes: 0,
    // Use the Firebase User ID instead of the local storage HACK
    userId: auth.currentUser.uid,
    postContent: postContent,
    timestamp: serverTimestamp(),
  };

  push(postsRefInDB, newPost);
  inputField.value = "";
});
