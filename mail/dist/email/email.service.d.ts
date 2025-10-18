import * as postmark from 'postmark';
import { ConfigService } from "@nestjs/config";
export declare class EmailService {
    private readonly configService;
    private client;
    private readonly sender;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, htmlBody: string): Promise<postmark.Models.MessageSendingResponse>;
    sendTemplateEmail(to: string, templateId: number, templateModel: Record<string, any>): Promise<postmark.Models.MessageSendingResponse>;
}
