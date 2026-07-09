import { DomainError } from './errors/domain.errors';

export class Result<T, E = DomainError> {
  private readonly _isSuccess: boolean;
  private readonly _error?: E;
  private readonly _value?: T;

  private constructor(isSuccess: boolean, error?: E, value?: T) {
    if (isSuccess && error) {
      throw new Error("InvalidOperation: A result cannot be successful and contain an error");
    }
    if (!isSuccess && !error) {
      throw new Error("InvalidOperation: A failing result needs to contain an error message");
    }

    this._isSuccess = isSuccess;
    this._error = error;
    this._value = value;
  }

  public get isSuccess(): boolean {
    return this._isSuccess;
  }

  public get isFailure(): boolean {
    return !this._isSuccess;
  }

  public get error(): E {
    if (this.isSuccess) {
      throw new Error("Can't get the error of a success result. Use 'isFailure' to check first.");
    }
    return this._error as E;
  }

  public get value(): T {
    if (this.isFailure) {
      throw new Error("Can't get the value of an error result. Use 'isSuccess' to check first.");
    }
    return this._value as T;
  }

  public static ok<U>(value?: U): Result<U, never> {
    return new Result<U, never>(true, undefined, value);
  }

  public static fail<E>(error: E): Result<never, E> {
    return new Result<never, E>(false, error);
  }
}
