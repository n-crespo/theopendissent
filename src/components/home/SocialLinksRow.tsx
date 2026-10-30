import { LINKS } from "../../lib/links";

export const SocialLinksRow = () => {
  const platforms = [
    {
      name: "Spotify",
      url: LINKS.spotify,
      img: "/spotify_logo.png",
      brandColor: "[0_0_8px_rgba(29,185,84,0.4)]",
    },
    {
      name: "Apple Podcasts",
      url: LINKS.applePodcasts,
      img: "/apple_podcasts_logo.png",
      brandColor: "[0_0_8px_rgba(135,46,196,0.4)]",
    },
    {
      name: "Instagram",
      url: LINKS.instagram,
      img: "/instagram_logo.png",
      brandColor: "[0_0_8px_rgba(237,49,126,0.4)]",
    },
    {
      name: "LinkedIn",
      url: LINKS.linkedin,
      img: "/linkedin_logo.png",
      brandColor: "[0_0_8px_rgba(10,102,194,0.4)]",
    },
  ];

  return (
    <div className="flex items-center justify-center gap-7">
      {platforms.map((platform) => (
        <a
          key={platform.name}
          href={platform.url}
          target="_blank"
          rel="noreferrer"
          title={platform.name}
          className="group relative flex items-center justify-center transition-transform duration-200 active:scale-90"
        >
          <img
            src={platform.img}
            alt={platform.name}
            className={`h-6 w-6 object-contain transition-all duration-300 ease-in-out ${platform.brandColor}`}
          />
        </a>
      ))}
    </div>
  );
};
