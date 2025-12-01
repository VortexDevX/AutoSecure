import { connectDatabase } from '../config/database';
import { EmailTemplate, User } from '../models';

const defaultTemplate = {
  template_id: 'premium_details',
  name: 'Policy Details Email',
  subject: 'Your Insurance Policy Details - {{policy_no}} | {{company_name}}',
  body_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Policy Details</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0f4f8;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 650px; margin: 0 auto;">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0; padding: 40px 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Logo Circle -->
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: white; font-size: 32px; font-weight: bold;">AS</span>
                    </div>
                    <h1 style="color: white; margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">{{company_name}}</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">{{company_tagline}}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Policy Badge -->
          <tr>
            <td style="background: white; padding: 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: -20px;">
                <tr>
                  <td align="center">
                    <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 12px 30px; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3);">
                      📋 Policy No: {{policy_no}}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background: white; padding: 30px 40px 40px;">
              
              <!-- Greeting -->
              <p style="color: #1a202c; font-size: 16px; margin: 0 0 25px;">
                Dear <strong>{{customer}}</strong>,
              </p>
              <p style="color: #4a5568; font-size: 15px; margin: 0 0 30px;">
                Thank you for choosing {{company_name}}. Please find your policy details below for your records.
              </p>

              <!-- Policy Information Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 25px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 3px; border-radius: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 10px;">
                      <tr>
                        <td style="padding: 20px 25px 15px;">
                          <h2 style="color: #667eea; margin: 0 0 15px; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
                            <span style="margin-right: 10px;">📋</span> Policy Information
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 25px 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Policy Number</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{policy_no}}</div>
                              </td>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Serial Number</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{serial_no}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Insurance Type</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{ins_type}}</div>
                              </td>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Insurance Company</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{ins_co_id}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Issue Date</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{issue_date}}</div>
                              </td>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Status</span>
                                <div style="color: #38a169; font-size: 15px; font-weight: 600; margin-top: 4px;">{{ins_status}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding: 10px 0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Policy Period</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{start_date}} → {{end_date}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Customer Information Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 25px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 3px; border-radius: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 10px;">
                      <tr>
                        <td style="padding: 20px 25px 15px;">
                          <h2 style="color: #11998e; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                            <span style="margin-right: 10px;">👤</span> Customer Information
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 25px 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Customer Name</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{customer}}</div>
                              </td>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Mobile Number</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{mobile_no}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Email Address</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{email}}</div>
                              </td>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">City</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{city_id}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td colspan="2" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Address</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{address_1}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Branch</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{branch_id}}</div>
                              </td>
                              <td style="padding: 10px 0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Executive</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{exicutive_name}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Vehicle Information Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 25px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 3px; border-radius: 12px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 10px;">
                      <tr>
                        <td style="padding: 20px 25px 15px;">
                          <h2 style="color: #f5576c; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                            <span style="margin-right: 10px;">🚗</span> Vehicle Information
                          </h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 25px 20px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Vehicle</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{manufacturer}} {{model_name}}</div>
                              </td>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Product Type</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{product}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Registration Number</span>
                                <div style="color: #1a202c; font-size: 17px; font-weight: 700; margin-top: 4px; letter-spacing: 1px;">{{registration_number}}</div>
                              </td>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Fuel Type</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{fuel_type}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Engine Number</span>
                                <div style="color: #1a202c; font-size: 14px; font-weight: 600; margin-top: 4px; font-family: monospace;">{{engine_no}}</div>
                              </td>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Chassis Number</span>
                                <div style="color: #1a202c; font-size: 14px; font-weight: 600; margin-top: 4px; font-family: monospace;">{{chassis_no}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Manufacturing Date</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{mfg_date}}</div>
                              </td>
                              <td style="padding: 10px 0;">
                                <span style="color: #718096; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Registration Date</span>
                                <div style="color: #1a202c; font-size: 15px; font-weight: 600; margin-top: 4px;">{{registration_date}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Company Info Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 25px;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center">
                          <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 16px; font-weight: 600;">Why Choose {{company_name}}?</h3>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="padding: 8px 15px;">
                                <div style="background: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                  <span style="font-size: 20px;">🛡️</span>
                                  <div style="color: #4a5568; font-size: 13px; margin-top: 5px;">Comprehensive Coverage</div>
                                </div>
                              </td>
                              <td style="padding: 8px 15px;">
                                <div style="background: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                  <span style="font-size: 20px;">⚡</span>
                                  <div style="color: #4a5568; font-size: 13px; margin-top: 5px;">Quick Claims</div>
                                </div>
                              </td>
                              <td style="padding: 8px 15px;">
                                <div style="background: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                                  <span style="font-size: 20px;">📞</span>
                                  <div style="color: #4a5568; font-size: 13px; margin-top: 5px;">24/7 Support</div>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachments Note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background: #fef3c7; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      <strong>📎 Note:</strong> Your policy documents are attached to this email for your records. Please keep them safe.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #1a202c; border-radius: 0 0 16px 16px; padding: 30px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="color: white; margin: 0 0 10px; font-size: 16px; font-weight: 600;">{{company_name}}</p>
                    <p style="color: #a0aec0; margin: 0 0 5px; font-size: 14px;">📧 {{company_email}} | 📞 {{company_phone}}</p>
                    <p style="color: #a0aec0; margin: 0 0 15px; font-size: 14px;">📍 {{company_address}}</p>
                    <div style="border-top: 1px solid #2d3748; padding-top: 15px; margin-top: 10px;">
                      <p style="color: #718096; margin: 0; font-size: 12px;">
                        This is an automated email. Generated on {{current_date}}
                      </p>
                      <p style="color: #718096; margin: 5px 0 0; font-size: 12px;">
                        © {{current_year}} {{company_name}}. All rights reserved.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  active: true,
};

async function seedEmailTemplate() {
  try {
    await connectDatabase();
    console.log('📧 Seeding email template...\n');

    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('❌ Owner user not found. Run initDb.ts first.');
      process.exit(1);
    }

    const existing = await EmailTemplate.findOne({
      template_id: defaultTemplate.template_id,
    });

    if (existing) {
      console.log(`⚠️  Template "${defaultTemplate.template_id}" already exists.`);
      console.log('Updating existing template with new design...\n');

      existing.name = defaultTemplate.name;
      existing.subject = defaultTemplate.subject;
      existing.body_html = defaultTemplate.body_html;
      existing.active = defaultTemplate.active;
      existing.updated_by = owner._id;
      await existing.save();

      console.log('✅ Email template updated successfully!');
    } else {
      const template = await EmailTemplate.create({
        ...defaultTemplate,
        created_by: owner._id,
        updated_by: owner._id,
      });

      console.log('✅ Email template created successfully!');
      console.log(`   Template ID: ${template.template_id}`);
      console.log(`   Name: ${template.name}`);
    }

    console.log('\n✅ Email template seeding complete!');
    console.log('\n📝 Template includes:');
    console.log('   - Policy Information section');
    console.log('   - Customer Information section');
    console.log('   - Vehicle Information section');
    console.log('   - Company Info Card');
    console.log('   - Beautiful gradient design');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding email template:', error);
    process.exit(1);
  }
}

seedEmailTemplate();
