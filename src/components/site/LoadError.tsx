import { Button } from "@/components/ui/button";

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function LoadError({ message, onRetry }: Props) {
  return (
    <div className="grid min-h-[50vh] place-items-center p-6">
      <div className="max-w-sm text-center space-y-3">
        <h2 className="text-lg font-semibold">Não conseguimos carregar os dados</h2>
        <p className="text-sm text-muted-foreground">
          {message ?? "Verifique sua conexão e tente novamente."}
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Button onClick={() => (onRetry ? onRetry() : window.location.reload())}>
            Recarregar
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't settle
 * within `ms` milliseconds. Prevents "eternal skeleton" states when a
 * server function hangs.
 */
export function withTimeout<T>(promise: Promise<T>, ms = 10_000, label = "request"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: ${label} took more than ${ms}ms`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
