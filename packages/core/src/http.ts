export type ApiSuccess<T> = {
  data: T;
  requestId: string;
};

export type ApiFailure = {
  error: {
    code: string;
    message: string;
  };
  requestId: string;
};

export function success<T>(data: T, requestId: string): ApiSuccess<T> {
  return { data, requestId };
}

export function failure(code: string, message: string, requestId: string): ApiFailure {
  return {
    error: {
      code,
      message
    },
    requestId
  };
}
