export type Platform = "instagram" | "twitter" | "facebook" | "tiktok" | "linkedin";

export interface FormattedPost {
  text: string;
  charLimit?: number;
}

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const limit = maxLength - 1;
  const truncated = text.slice(0, limit);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > limit * 0.6 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

function formatInstagram(caption: string, hashtags: string[], cta: string): FormattedPost {
  let text = caption;
  if (cta) text += `\n\n${cta}`;
  if (hashtags.length > 0) {
    text += "\n\n.\n.\n.\n\n" + hashtags.join(" ");
  }
  return { text };
}

function formatTwitter(caption: string, hashtags: string[], cta: string): FormattedPost {
  const charLimit = 280;
  const topHashtags = hashtags.slice(0, 3);
  const hashtagText = topHashtags.join(" ");
  const reservedForTags = hashtagText.length > 0 ? hashtagText.length + 1 : 0;
  const available = charLimit - reservedForTags;

  let text = caption;
  if (cta) {
    const withCta = `${caption}\n\n${cta}`;
    if (withCta.length <= available) {
      text = withCta;
    } else {
      text = truncateAtWord(caption, available);
    }
  } else {
    text = truncateAtWord(caption, available);
  }

  if (hashtagText.length > 0) {
    text += "\n" + hashtagText;
  }

  return { text, charLimit };
}

function formatFacebook(caption: string, hashtags: string[], cta: string): FormattedPost {
  let text = caption;
  if (cta) text += `\n\n${cta}`;
  if (hashtags.length > 0) {
    text += "\n\n" + hashtags.join(" ");
  }
  return { text };
}

function formatTiktok(caption: string, hashtags: string[], _cta: string): FormattedPost {
  const charLimit = 2200;
  const hashtagText = hashtags.join(" ");
  const reservedForTags = hashtagText.length > 0 ? hashtagText.length + 1 : 0;
  const available = Math.min(150, charLimit - reservedForTags);

  const firstSentence = caption.match(/^[^.!?]*[.!?]/)?.[0] || caption;
  let text = truncateAtWord(firstSentence, available);

  if (hashtagText.length > 0) {
    text += " " + hashtagText;
  }

  return { text, charLimit };
}

function formatLinkedin(caption: string, hashtags: string[], cta: string): FormattedPost {
  let text = caption;
  if (cta) text += `\n\n${cta}`;
  const topHashtags = hashtags.slice(0, 3);
  if (topHashtags.length > 0) {
    text += "\n\n" + topHashtags.join(" ");
  }
  return { text, charLimit: 3000 };
}

const formatters: Record<Platform, (caption: string, hashtags: string[], cta: string) => FormattedPost> = {
  instagram: formatInstagram,
  twitter: formatTwitter,
  facebook: formatFacebook,
  tiktok: formatTiktok,
  linkedin: formatLinkedin,
};

export function formatForPlatform(
  platform: Platform,
  caption: string,
  hashtags: string[],
  cta: string
): FormattedPost {
  return formatters[platform](caption ?? "", hashtags ?? [], cta ?? "");
}
