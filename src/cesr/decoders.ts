/* Optional CBOR/MGPK body decoders for the walker (decision s7bk4m).
 *
 * This module — and ONLY this module — pulls in the cbor-x and @msgpack/msgpack dependencies. The
 * core walker (./walk) never imports it, so a consumer that only needs JSON pays nothing for these;
 * a consumer that wants CBOR/MGPK imports `serializationDecoders` and passes it to walk(). At package
 * extraction time (this.i r4vkp7) this module and its two dependencies become the separate
 * serialization package. */

import { decode as decodeCbor } from 'cbor-x';
import { decode as decodeMgpk } from '@msgpack/msgpack';
import type { BodyDecoder } from './types';

/** Body decoders for the binary CESR serializations, keyed by version-string kind. Inject into
 * walk(bytes, { decoders: serializationDecoders }) to decode CBOR/MGPK bodies the same as JSON. */
export const serializationDecoders: Record<string, BodyDecoder> = {
  CBOR: (body) => decodeCbor(body) as Record<string, unknown>,
  MGPK: (body) => decodeMgpk(body) as Record<string, unknown>,
};
