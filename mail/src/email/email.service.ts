import { Injectable } from '@nestjs/common';
import * as postmark from 'postmark';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class EmailService {
    private client: postmark.ServerClient;
    private readonly sender: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('POSTMARK_API_KEY');
        if (!apiKey) throw new Error('POSTMARK_API_KEY is missing');

        const sender = this.configService.get<string>('POSTMARK_SENDER');
        if (!sender) throw new Error('POSTMARK_SENDER is missing');
        this.sender = sender;

        this.client = new postmark.ServerClient(apiKey);
    }

    /**
     * Send email
     * @param to
     * @param subject
     * @param htmlBody
     */
    async sendEmail(to: string, subject: string, htmlBody: string) {
        return this.client.sendEmail({
            From: this.sender,
            To: to,
            Subject: subject,
            HtmlBody: htmlBody,
        });
    }

    /**
     * Send email with template
     * @param to
     * @param templateId
     * @param templateModel
     */
    async sendTemplateEmail(to: string, templateId: number, templateModel: Record<string, any>) {
        return this.client.sendEmailWithTemplate({
            From: this.sender,
            To: to,
            TemplateId: templateId,
            TemplateModel: templateModel,
        });
    }
}
