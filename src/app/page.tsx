import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { Image as ImageIcon } from "@phosphor-icons/react/dist/ssr/Image";
import { Translate } from "@phosphor-icons/react/dist/ssr/Translate";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { PencilLine } from "@phosphor-icons/react/dist/ssr/PencilLine";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PencilLine className="h-4.5 w-4.5" weight="fill" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight">
            AI Content Gen
          </span>
        </div>
        <Link
          href="/login"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 sm:px-10">
        <div className="flex flex-col items-center gap-10 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm text-muted-foreground animate-fade-in-up stagger-1">
            <Sparkle className="h-3.5 w-3.5 text-primary" weight="fill" />
            Free &amp; open AI stack
          </div>

          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-foreground animate-fade-in-up stagger-2">
            Your content,
            <br />
            <span className="italic text-primary">refined</span> for social
          </h1>

          <p className="text-lg text-muted-foreground max-w-md leading-relaxed animate-fade-in-up stagger-3">
            Turn videos, images, and ideas into scroll-stopping captions and
            teaser images — instantly, beautifully.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row animate-fade-in-up stagger-4">
            <Link
              href="/login"
              className={buttonVariants({
                size: "lg",
                className:
                  "text-base px-8 btn-press transition-all gap-2",
              })}
            >
              Get Started
              <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
          </div>

          <div className="w-full max-w-xl mt-6 border-t border-border/40 pt-14 animate-fade-in-up stagger-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground/70 mb-8 font-medium">
              Everything you need
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-3 animate-fade-in-up stagger-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/8 text-primary">
                  <Lightning className="h-5 w-5" weight="duotone" />
                </div>
                <span className="font-heading text-sm font-medium">
                  Smart Captions
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Multiple tones, lengths
                  <br />
                  and languages
                </span>
              </div>
              <div className="flex flex-col items-center gap-3 animate-fade-in-up stagger-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/8 text-primary">
                  <ImageIcon className="h-5 w-5" weight="duotone" />
                </div>
                <span className="font-heading text-sm font-medium">
                  Teaser Images
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  AI-generated visuals
                  <br />
                  for every post
                </span>
              </div>
              <div className="flex flex-col items-center gap-3 animate-fade-in-up stagger-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/8 text-primary">
                  <Translate className="h-5 w-5" weight="duotone" />
                </div>
                <span className="font-heading text-sm font-medium">
                  Multi-language
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  English, Filipino
                  <br />
                  Cebuano, Taglish
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground/50 animate-fade-in">
        Powered by Gemini AI + Pollinations
      </footer>
    </div>
  );
}
