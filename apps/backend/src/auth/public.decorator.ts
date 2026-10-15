import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Opts a handler or controller out of the global JWT guard. Use sparingly. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
