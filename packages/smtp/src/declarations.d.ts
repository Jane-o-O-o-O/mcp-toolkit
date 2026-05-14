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
  interface ImapOptions {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
  }

  class Imap {
    constructor(options: ImapOptions);
    connect(): void;
    end(): void;
    openBox(name: string, readOnly: boolean, cb: (err: Error | null, box: any) => void): void;
    seq: { fetch(range: string, options: any): any };
    search(criteria: any[], cb: (err: Error | null, uids: number[]) => void): void;
    fetch(uids: number[], options: any): any;
    addFlags(uid: string, flags: string[], cb: (err: Error | null) => void): void;
    getBoxes(cb: (err: Error | null, boxes: Record<string, { delimiter?: string }>) => void): void;
    once(event: "ready", cb: () => void): void;
    once(event: "error", cb: (err: Error) => void): void;
  }

  export default Imap;
}
