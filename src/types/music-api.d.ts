// @meting/core 与 aes-js 无官方类型声明，这里提供最小环境声明供类型检查使用
declare module "@meting/core" {
  export default class Meting {
    constructor(server?: string);
    provider: any;
    header: Record<string, string>;
    isFormat: boolean;
    temp: Record<string, any>;
    site(server: string): this;
    cookie(c: string): this;
    format(v: boolean): this;
    search(keyword: string, opts?: { type?: number; limit?: number; page?: number }): Promise<string>;
    song(id: string | number): Promise<string>;
    album(id: string | number): Promise<string>;
    artist(id: string | number, n?: number): Promise<string>;
    playlist(id: string | number): Promise<string>;
    url(id: string | number, br?: number): Promise<string>;
    lyric(id: string | number): Promise<string>;
    pic(id: string | number, size?: number): Promise<string>;
  }
}

declare module "aes-js" {
  export default class AES {
    static ModeOfOperation: {
      ecb: new (key: Uint8Array) => { encrypt(bytes: Uint8Array): Uint8Array; decrypt(bytes: Uint8Array): Uint8Array };
    };
    static padding: {
      pkcs7: { pad(data: Uint8Array): Uint8Array };
    };
  }
}
