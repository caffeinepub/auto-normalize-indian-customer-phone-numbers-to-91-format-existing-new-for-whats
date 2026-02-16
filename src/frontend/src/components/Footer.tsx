import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex h-16 items-center justify-center text-sm text-muted-foreground">
        <p className="flex items-center gap-1">
          © 2025. Built with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> using{' '}
          <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
