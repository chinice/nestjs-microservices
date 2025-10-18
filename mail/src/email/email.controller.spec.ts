import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { Logger } from '@nestjs/common';

describe('EmailController', () => {
  let controller: EmailController;
  let emailService: EmailService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
            sendTemplateEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmailController>(EmailController);
    emailService = module.get<EmailService>(EmailService);

    // Spy on the logger
    loggerSpy = jest.spyOn(controller['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(controller['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should call sendTemplateEmail if templateId and templateModel are provided', async () => {
      const data = {
        to: 'test@example.com',
        templateId: 12345,
        templateModel: { name: 'John' },
      };

      await controller.sendEmail(data);

      expect(emailService.sendTemplateEmail).toHaveBeenCalledWith(
          data.to,
          data.templateId,
          data.templateModel,
      );
      expect(loggerSpy).toHaveBeenCalledWith(`Email sent via template to ${data.to}`);
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should call sendEmail if templateId or templateModel are missing', async () => {
      const data = {
        to: 'test@example.com',
        subject: 'Hello',
        htmlBody: '<p>Hello World</p>',
      };

      await controller.sendEmail(data);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
          data.to,
          data.subject,
          data.htmlBody,
      );
      expect(loggerSpy).toHaveBeenCalledWith(`Email sent to ${data.to}`);
      expect(emailService.sendTemplateEmail).not.toHaveBeenCalled();
    });

    it('should log error if sending email fails', async () => {
      const data = {
        to: 'fail@example.com',
        subject: 'Hello',
        htmlBody: '<p>Hello</p>',
      };

      (emailService.sendEmail as jest.Mock).mockRejectedValue(new Error('Service failed'));
      const errorSpy = jest.spyOn(controller['logger'], 'error');

      await controller.sendEmail(data);

      expect(errorSpy).toHaveBeenCalledWith(
          `Failed to send email to ${data.to}: Service failed`,
      );
    });
  });
});
