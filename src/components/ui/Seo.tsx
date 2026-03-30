// src/components/ui/Seo.tsx
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface SeoProps {
  title?: string;
  description?: string;
}

export const SEO = ({ title, description }: SeoProps) => {
  const location = useLocation();
  const baseUrl = "https://theopendissent.com";
  // remove query params for the canonical link
  const canonicalUrl = `${baseUrl}${location.pathname}`;

  const siteName = "The Open Dissent";
  const fullTitle = title ? `${title} - ${siteName}` : siteName;
  const defaultDesc = "Join the debate on The Open Dissent.";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <link rel="canonical" href={canonicalUrl} />
      <meta name="description" content={description || defaultDesc} />
      {/* open graph / social media tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDesc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
    </Helmet>
  );
};
