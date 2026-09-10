// Icônes de marque en SVG inline : lucide-react n'inclut plus les logos de
// réseaux sociaux (Facebook, Instagram, TikTok, YouTube...) depuis ses
// versions récentes, donc on les dessine nous-mêmes en SVG minimal.
// Elles utilisent currentColor pour suivre automatiquement la couleur
// définie par .social-links__item (voir refactor.css), donc pas de
// perturbation entre mode clair et mode sombre.

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14.5 3h2.1c.2 1.6 1.4 2.9 3.1 3.2v2.2c-1.2 0-2.3-.4-3.2-1v6.4c0 3-2.4 5.2-5.2 5.2S6.1 17 6.1 14s2.4-5.2 5.2-5.2c.3 0 .6 0 .9.1v2.3c-.3-.1-.6-.2-.9-.2-1.6 0-2.9 1.3-2.9 3s1.3 3 2.9 3 3-1.3 3-3V3Z" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14 21v-7h2.4l.4-3H14V9.2c0-.9.3-1.5 1.6-1.5H17V5.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V11H8v3h2.6v7H14Z" />
    </svg>
  );
}

function YouTubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.6 7.6c-.2-1.1-1-1.9-2.1-2.1C17.7 5 12 5 12 5s-5.7 0-7.5.5c-1.1.2-1.9 1-2.1 2.1C2 9.4 2 12 2 12s0 2.6.4 4.4c.2 1.1 1 1.9 2.1 2.1C6.3 19 12 19 12 19s5.7 0 7.5-.5c1.1-.2 1.9-1 2.1-2.1.4-1.8.4-4.4.4-4.4s0-2.6-.4-4.4ZM10 15V9l5 3-5 3Z" />
    </svg>
  );
}

const socialLinks = [
  { name: "Instagram", href: "https://instagram.com/tonprofil", Icon: InstagramIcon },
  { name: "TikTok", href: "https://tiktok.com/tonprofil", Icon: TikTokIcon },
  { name: "Facebook", href: "https://facebook.com/tonprofil", Icon: FacebookIcon },
  { name: "YouTube", href: "https://youtube.com/@tonprofil", Icon: YouTubeIcon },
];

export default function SocialLinks() {
  return (
    <div className="social-links" aria-label="Réseaux sociaux Echoppe Togo">
      {socialLinks.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          title={name}
          className="social-links__item"
        >
          <Icon className="social-links__icon" />
        </a>
      ))}
    </div>
  );
}
