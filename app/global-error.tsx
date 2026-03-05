'use client';
import { Button } from '../components/ui'

export default function GlobalError({
  error,
  reset



}: {error: Error & {digest?: string;};reset: () => void;}) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col justify-center items-center min-h-screen">
          <h2 className="mb-3">Something went wrong</h2>
          <p className="text-surface-500 mb-4">{error.message || 'An unexpected error occurred.'}</p>
          <Button onClick={reset}>
            Try Again
          </Button>
        </div>
      </body>
    </html>);

}