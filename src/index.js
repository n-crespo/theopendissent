// import firebase functions
// NEW IMPORTS using the 'firebase/...' bare specifiers (Vite resolves these)
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
  databaseURL: "https://test-app-d0afd-default-rtdb.firebaseio.com",
};

// USING THE DATABASE
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const postsRefInDB = ref(database, "posts"); // create a reference (required)

const inputField = document.getElementById("input-field");
const submitPostBtn = document.getElementById("post-btn");
const postList = document.getElementById("post-list");
const signinBtn = document.getElementById("signin-btn");
const headerIcon = document.getElementById("header-icon");

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
      <i class="fa-solid fa-check"></i>
    </button>
    <button class="post-button interesting-button">
      <i class="fa-solid fa-fire-flame-curved"></i>
    </button>
    <button class="post-button disagree-button">
      <i class="fa-solid fa-xmark"></i>
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

// Checks for a stored user ID and creates a new one if it doesn't exist.
function getOrCreateUserID() {
  let userId = localStorage.getItem("user-id");
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("user-id", userId);
  }
  return userId;
}

// submit input field
submitPostBtn.addEventListener("click", function () {
  const postContent = inputField.value;

  if (postContent.trim() === "") {
    return;
  }

  const newPost = {
    likes: 0,
    userId: getOrCreateUserID(),
    postContent: postContent,
    timestamp: serverTimestamp(),
  };

  push(postsRefInDB, newPost); // push the post
  inputField.value = "";
});

// avoid FOUC
let domReady = (cb) => {
  document.readyState === "interactive" || document.readyState === "complete"
    ? cb()
    : document.addEventListener("DOMContentLoaded", cb);
};

domReady(() => {
  // Display body when DOM is loaded
  document.body.style.visibility = "visible";
});
