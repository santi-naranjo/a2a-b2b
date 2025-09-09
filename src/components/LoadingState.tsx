'use client';

import { Loader2, Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function LoadingState() {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start space-x-2 max-w-[80%]">
        <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">
                Analyzing your request and contacting vendors...
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground/70">
              This may take a few moments while we gather the best quotes for you
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 