"use client";

import { LogoIcon } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export function FullPageLoader() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center">
        {/* Animated Glow Effect */}
        <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/20 blur-2xl" />
        
        {/* Logo with scaling animation */}
        <div className="relative mb-8 animate-in fade-in zoom-in duration-500">
           <div className="h-16 w-16 animate-bounce transition-transform duration-1000 ease-in-out">
            <LogoIcon className="h-full w-full" />
           </div>
        </div>

        {/* Loading text and bar */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium tracking-widest text-foreground/80 uppercase">
              Loading
            </span>
            <div className="flex space-x-1">
              <div className="h-1 w-1 animate-bounce rounded-full bg-primary delay-0" />
              <div className="h-1 w-1 animate-bounce rounded-full bg-primary delay-150" />
              <div className="h-1 w-1 animate-bounce rounded-full bg-primary delay-300" />
            </div>
          </div>
          
          <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full animate-progress rounded-full bg-primary" />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 50%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
