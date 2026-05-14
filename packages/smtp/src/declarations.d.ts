/** Ambient type declarations for optional SMTP/IMAP dependencies */
declare module "nodemailer" {
  interface SendMailOptions {
    from?: string;
    to?: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    text?: string;
    html?: string;
    replyTo?: string;
  }

  interface SendResult {
    messageId?: string;
    accepted?: string[];
    rejected?: string[];
  }

  interface Transporter {
    sendMail(options: SendMailOptions): Promise<SendResult>;
  }

  interface TransportOptions {
    host: string;
    port: number;
    secure: boolean;
    auth?: { user: string; pass: string };
  }

  export function createTransport(options: TransportOptions): Transporter;
}

declare module "imap" {
  import { EventEmitter } from "node:events";
  import { Readable } from "node:stream";

  interface ImapOptions {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
  }

  interface MailBox {
    name: string;
    delimiter: string;
    flags: string[];
    exists: number;
  }

  interface FetchOptions {
    bodies?: string | string[];
    markSeen?: boolean;
    struct?: boolean;
  }

  interface MessageAttributes {
    uid: number;
    flags: string[];
    date: Date;
    struct: unknown[];
    size: number;
  }

  interface Fetch extends EventEmitter {
    on(event: "message", cb: (msg: MessageEvent, seqno: number) => void): this;
    on(event: "error", cb: (err: Error) => void): this;
    on(event: "end", cb: () => void): this;
  }

  interface MessageEvent extends EventEmitter {
    on(event: "body", cb: (stream: Readable, info: { which: string; size: number }) => void): this;
    on(event: "attributes", cb: (attrs: MessageAttributes) => void): this;
    on(event: "end", cb: () => void): this;
  }

  class Imap {
    constructor(options: ImapOptions);
    connect(): void;
    end(): void;
    openBox(name: string, readOnly: boolean, cb: (err: Error | null, box: MailBox) => void): void;
    seq: { fetch(range: string, options: FetchOptions): Fetch };
    search(criteria: unknown[], cb: (err: Error | null, uids: number[]) => void): void;
    fetch(uids: number[], options: FetchOptions): Fetch;
    addFlags(uid: string, flags: string[], cb: (err: Error | null) => void): void;
    getBoxes(cb: (err: Error | null, boxes: Record<string, { delimiter?: string }>) => void): void;
    once(event: "ready", cb: () => void): this;
    once(event: "error", cb: (err: Error) => void): this;
  }

  export default Imap;
}
