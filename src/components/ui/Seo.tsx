import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface SeoProps {
  title?: string;
  description?: string;
}

export const SEO = ({ title, description }: SeoProps) => {
  const location = useLocation();
  const baseUrl = "https://www.theopendissent.com";
  // remove query params for the canonical link
  const canonicalUrl = `${baseUrl}${location.pathname}`;

  const siteName = "The Open Dissent";
  const fullTitle = title ? `${title} - ${siteName}` : siteName;
  const defaultDesc = "Join the debate on The Open Dissent.";
  const desc = description || defaultDesc;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonicalUrl} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta
        name="twitter:image"
        content="https://theopendissent.com/og-image.png"
      />
      <meta property="twitter:domain" content="theopendissent.com" />
      <meta property="twitter:url" content={canonicalUrl} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta
        property="og:image"
        content="https://theopendissent.com/og-image.png"
      />
    </Helmet>
  );
};
