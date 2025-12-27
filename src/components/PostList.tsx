import { useState, useEffect } from "react";
import { PostItem } from "./PostItem";
import { usePosts } from "../hooks/usePosts";
import { getPostById } from "../lib/firebase";
import { Post } from "../types";

/**
 * displays the main feed with support for deep-linked post injection.
 */
export const PostList = () => {
  const { posts, loading, loadMore, currentLimit } = usePosts(20);
  const [injectedPost, setInjectedPost] = useState<Post | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("s");

    if (sharedId) {
      const fetchAndInject = async () => {
        const target = await getPostById(sharedId);
        if (!target) return;

        // if reply, fetch parent to inject into main feed
        if (target.parentPostId) {
          const parent = await getPostById(target.parentPostId);
          if (parent) setInjectedPost(parent);
        } else {
          setInjectedPost(target);
        }
      };
      fetchAndInject();
    }
  }, []);

  // filter out the injected post from the main list to prevent duplicates
  const filteredPosts = injectedPost
    ? posts.filter((p) => p.id !== injectedPost.id)
    : posts;

  const hasMore = posts.length >= currentLimit;

  return (
    <div className="flex flex-col">
      {/* priority injection for shared content */}
      {injectedPost && (
        <PostItem
          key={`injected-${injectedPost.id}`}
          post={injectedPost}
          highlighted={true}
        />
      )}

      {filteredPosts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}

      {hasMore && (
        <button
          className="mx-auto my-8 block cursor-pointer border bg-white px-8 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:opacity-50"
          style={{
            borderRadius: "var(--radius-button)",
            borderColor: "var(--color-border-subtle)",
          }}
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <i className="bi bi-three-dots animate-pulse"></i>
              <span>Loading...</span>
            </div>
          ) : (
            "Load More"
          )}
        </button>
      )}
    </div>
  );
};
