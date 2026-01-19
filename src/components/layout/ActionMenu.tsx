import { Post } from "../../types";
import { useShare } from "../../hooks/useShare";
import { useReport } from "../../hooks/useReport";
import { DropdownMenu, MenuItem, MenuSeparator } from "../ui/DropdownMenu";

interface ActionMenuProps {
  post: Post;
  isOwner: boolean;
  currentUserId?: string;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const ActionMenu = ({
  post,
  isOwner,
  currentUserId,
  onEdit,
  onDelete,
}: ActionMenuProps) => {
  const { sharePost } = useShare();
  const { reportPost } = useReport();

  return (
    <DropdownMenu
      trigger={
        <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none">
          <i className="bi bi-three-dots text-lg"></i>
        </div>
      }
    >
      {isOwner ? (
        <>
          <MenuItem
            icon="bi-pencil-square"
            label="Edit Post"
            onClick={onEdit}
          />
          <MenuItem
            icon="bi-trash3"
            label="Delete"
            onClick={onDelete}
            variant="danger"
          />
          <MenuSeparator />
        </>
      ) : (
        // only show Report if user is logged in (currentUserId exists)
        currentUserId && (
          <MenuItem
            icon="bi-flag"
            label="Report"
            onClick={() => reportPost(post.id, currentUserId)}
          />
        )
      )}

      <MenuItem icon="bi-share" label="Share" onClick={() => sharePost(post)} />
    </DropdownMenu>
  );
};
