export { cn } from "cn"
// Define the success/failure tuple types
export type OperationSuccess<T> = readonly [data: T, error: null];
export type OperationFailure<E> = readonly [data: null, error: E];
export type OperationResult<T, E> = OperationSuccess<T> | OperationFailure<E>;

// Define the allowed operation types
/**
 * Checks if the value is a Promise or "Thenable"
 * @param value - The value to check
 * @returns True if the value is a Promise, false otherwise
 */
export function isPromise<T = any>(value: unknown): value is Promise<T> {
    return (
        !!value &&
      (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as any).then === 'function'
);
}
type Operation<T> = Promise<T> | (() => T) | (() => Promise<T>);
// --- Function Overloads ---

// Handle existing Promises
export function trycatch<T, E = Error>(
  operation: Promise<T>,
): Promise<OperationResult<T, E>>;

// Handle functions that throw 'never' (e.g., a redirect or process exit)
export function trycatch<T, E = Error>(
  operation: () => never,
): OperationResult<never, E>;

// Handle async functions
export function trycatch<T, E = Error>(
  operation: () => Promise<T>,
): Promise<OperationResult<T, E>>;

// Handle sync functions
export function trycatch<T, E = Error>(
  operation: () => T,
): OperationResult<T, E>;

// --- Main Function Implementation ---
export function trycatch<T, E = Error>(
  operation: Operation<T>,
): OperationResult<T, E> | Promise<OperationResult<T, E>> {

  // Helper functions for consistent returns
  const onSuccess = <T>(value: T): OperationSuccess<T> => {
    return [value, null];
  };

  const onFailure = <E>(error: unknown): OperationFailure<E> => {
    const errorParsed = error instanceof Error ? error : new Error(String(error));
    return [null, errorParsed as E];
  };

  try {
    // Execute the operation
    // If it's a function, call it. Otherwise, use the value (which is a Promise).
    const result = typeof operation === 'function' ? operation() : operation;

    // Check if the result is a promise (or thenable)
    if (isPromise(result)) {
      return Promise.resolve(result)
        .then((data) => onSuccess(data))
        .catch((error) => onFailure(error));
    }

    // If not a promise, it's a sync result
    return onSuccess(result);

  } catch (error) {
    // Handle sync errors
    return onFailure<E>(error);
  }
}
