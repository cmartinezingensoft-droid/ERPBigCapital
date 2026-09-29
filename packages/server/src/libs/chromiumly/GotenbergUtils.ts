import * as FormData from 'form-data';
import { Axios, AxiosError } from 'axios';

export class GotenbergUtils {
  public static assert(condition: boolean, message: string): asserts condition {
    if (!condition) {
      throw new Error(message);
    }
  }

  public static async fetch(endpoint: string, data: FormData): Promise<Buffer> {
    try {
      const response = await new Axios({
        headers: {
          ...data.getHeaders(),
        },
        responseType: 'arraybuffer', // This ensures you get a Buffer bac
      }).post(endpoint, data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const cause = axiosError.cause as
        | { code?: string; address?: string; port?: number }
        | undefined;
      const details = cause?.code
        ? ` (${cause.code}${cause.address ? ` ${cause.address}` : ''}${
            cause.port ? `:${cause.port}` : ''
          })`
        : '';

      throw new Error(
        `Could not convert document to PDF via Gotenberg at ${endpoint}${details}.`,
      );
    }
  }
}
