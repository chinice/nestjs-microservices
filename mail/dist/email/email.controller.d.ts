import { EmailService } from "./email.service";
export declare class EmailController {
    private readonly emailService;
    private readonly logger;
    constructor(emailService: EmailService);
    sendEmail(data: any): Promise<void>;
}
