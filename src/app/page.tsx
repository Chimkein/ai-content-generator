import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { Image as ImageIcon } from "@phosphor-icons/react/dist/ssr/Image";
import { Translate } from "@phosphor-icons/react/dist/ssr/Translate";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4 animate-fade-in">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkle className="h-4 w-4" weight="fill" />
          </div>
          <span>AI Content Gen</span>
        </div>
        <Link
          href="/login"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20">
        <div className="flex flex-col items-center gap-8 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground animate-fade-in-up stagger-1">
            <Lightning className="h-3.5 w-3.5 text-primary" weight="fill" />
            Powered by Gemini AI + Pollinations
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent animate-fade-in-up stagger-2">
            Content that converts, created in seconds
          </h1>

          <p className="text-lg text-muted-foreground max-w-md leading-relaxed animate-fade-in-up stagger-3">
            Turn your videos, images, and ideas into scroll-stopping social
            media captions and teaser images — instantly.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row animate-fade-in-up stagger-4">
            <Link
              href="/login"
              className={buttonVariants({
                size: "lg",
                className: "text-base px-8 btn-press hover:shadow-lg hover:shadow-primary/20 transition-all",
              })}
            >
              <Sparkle className="mr-2 h-4 w-4" weight="fill" />
              Get Started Free
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-8 w-full max-w-lg">
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 card-hover animate-fade-in-up stagger-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lightning className="h-5 w-5" weight="duotone" />
              </div>
              <span className="text-sm font-medium">Smart Captions</span>
              <span className="text-xs text-muted-foreground text-center">
                Multiple tones, lengths, and languages
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 card-hover animate-fade-in-up stagger-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImageIcon className="h-5 w-5" weight="duotone" />
              </div>
              <span className="text-sm font-medium">Teaser Images</span>
              <span className="text-xs text-muted-foreground text-center">
                AI-generated visuals for your posts
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-5 card-hover animate-fade-in-up stagger-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Translate className="h-5 w-5" weight="duotone" />
              </div>
              <span className="text-sm font-medium">Multi-language</span>
              <span className="text-xs text-muted-foreground text-center">
                English, Filipino, Cebuano, Taglish
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
