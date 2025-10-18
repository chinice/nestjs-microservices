"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("./email.service");
const microservices_1 = require("@nestjs/microservices");
let EmailController = EmailController_1 = class EmailController {
    emailService;
    logger = new common_1.Logger(EmailController_1.name);
    constructor(emailService) {
        this.emailService = emailService;
    }
    async sendEmail(data) {
        try {
            if (data.templateId && data.templateModel) {
                await this.emailService.sendTemplateEmail(data.to, data.templateId, data.templateModel);
                this.logger.log(`Email sent via template to ${data.to}`);
            }
            else {
                await this.emailService.sendEmail(data.to, data.subject, data.htmlBody);
                this.logger.log(`Email sent to ${data.to}`);
            }
        }
        catch (err) {
            this.logger.error(`Failed to send email to ${data.to}: ${err.message}`);
        }
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, microservices_1.EventPattern)('send_email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendEmail", null);
exports.EmailController = EmailController = EmailController_1 = __decorate([
    (0, common_1.Controller)('email'),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], EmailController);
//# sourceMappingURL=email.controller.js.map