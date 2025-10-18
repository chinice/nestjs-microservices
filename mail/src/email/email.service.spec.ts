import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import * as postmark from 'postmark';

jest.mock('postmark');

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      sendEmail: jest.fn(),
      sendEmailWithTemplate: jest.fn(),
    };

    // Mock postmark.ServerClient to return our mock client
    (postmark.ServerClient as jest.Mock).mockImplementation(() => mockClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'POSTMARK_API_KEY':
                  return 'fake-api-key';
                case 'POSTMARK_SENDER':
                  return 'test@domain.com';
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 🔹 sendEmail
  describe('sendEmail', () => {
    it('should call client.sendEmail with correct parameters', async () => {
      mockClient.sendEmail.mockResolvedValue({ Message: 'ok' });

      const to = 'recipient@test.com';
      const subject = 'Test Subject';
      const htmlBody = '<p>Hello</p>';

      const result = await service.sendEmail(to, subject, htmlBody);

      expect(mockClient.sendEmail).toHaveBeenCalledWith({
        From: 'test@domain.com',
        To: to,
        Subject: subject,
        HtmlBody: htmlBody,
      });
      expect(result).toEqual({ Message: 'ok' });
    });
  });

  // 🔹 sendTemplateEmail
  describe('sendTemplateEmail', () => {
    it('should call client.sendEmailWithTemplate with correct parameters', async () => {
      mockClient.sendEmailWithTemplate.mockResolvedValue({ Message: 'ok' });

      const to = 'recipient@test.com';
      const templateId = 12345;
      const templateModel = { name: 'John', link: 'http://test.com' };

      const result = await service.sendTemplateEmail(to, templateId, templateModel);

      expect(mockClient.sendEmailWithTemplate).toHaveBeenCalledWith({
        From: 'test@domain.com',
        To: to,
        TemplateId: templateId,
        TemplateModel: templateModel,
      });
      expect(result).toEqual({ Message: 'ok' });
    });
  });

  // 🔹 Config missing
  it('should throw if POSTMARK_API_KEY is missing', async () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'POSTMARK_API_KEY') return null;
      if (key === 'POSTMARK_SENDER') return 'test@domain.com';
    });

    await expect(
        Test.createTestingModule({
          providers: [EmailService, { provide: ConfigService, useValue: configService }],
        }).compile(),
    ).rejects.toThrow('POSTMARK_API_KEY is missing');
  });

  it('should throw if POSTMARK_SENDER is missing', async () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'POSTMARK_API_KEY') return 'fake-key';
      if (key === 'POSTMARK_SENDER') return null;
    });

    await expect(
        Test.createTestingModule({
          providers: [EmailService, { provide: ConfigService, useValue: configService }],
        }).compile(),
    ).rejects.toThrow('POSTMARK_SENDER is missing');
  });
});
