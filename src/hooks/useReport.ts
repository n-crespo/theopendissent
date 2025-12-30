import { useCallback } from "react";

const FORM_BASE_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdRBsVqe7UhMhprUmt3dnyhGiokHRPapXzPLwmxhizeMtHjkQ/viewform";
const ENTRY_POST_ID = "entry.175932122";
const ENTRY_USER_ID = "entry.625171225";

export const useReport = () => {
  const reportPost = useCallback((postId: string, reporterUserId?: string) => {
    const params = new URLSearchParams();
    params.append("usp", "pp_url");
    params.append(ENTRY_POST_ID, postId);

    if (reporterUserId) {
      params.append(ENTRY_USER_ID, reporterUserId);
    } else {
      params.append(ENTRY_USER_ID, "anonymous");
    }

    const reportUrl = `${FORM_BASE_URL}?${params.toString()}`;
    window.open(reportUrl, "_blank", "noopener,noreferrer");
  }, []);

  return { reportPost };
};
