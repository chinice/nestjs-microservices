import {Controller, Logger} from '@nestjs/common';
import {EmailService} from "./email.service";
import { EventPattern } from "@nestjs/microservices";

@Controller('email')
export class EmailController {
    private readonly logger = new Logger(EmailController.name);

    constructor(private readonly emailService: EmailService) {}

    /**
     * Event listener to send emails
     *
     * @param data
     */
    @EventPattern('send_email')
    async sendEmail(data: any): Promise<void> {
        try {
            if (data.templateId && data.templateModel) {
                await this.emailService.sendTemplateEmail(data.to, data.templateId, data.templateModel);
                this.logger.log(`Email sent via template to ${data.to}`);
            } else {
                await this.emailService.sendEmail(data.to, data.subject, data.htmlBody);
                this.logger.log(`Email sent to ${data.to}`);
            }
        } catch (err) {
            this.logger.error(`Failed to send email to ${data.to}: ${err.message}`);
        }
    }
}
