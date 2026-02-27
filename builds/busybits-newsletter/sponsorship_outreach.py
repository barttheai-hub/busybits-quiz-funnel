#!/usr/bin/env python3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

companies = [
    {
        'company': 'Eight Sleep',
        'email': 'press@eightsleep.com',
        'target_name': 'Matteo Franceschetti',
        'subject': '8 hours in 6 (Why I recommend the Pod)',
        'body_template': '''Hey [Name],

I’ve been sleeping on the Pod for 6 months and it’s the single highest-ROI hardware I own. My deep sleep numbers went from 1.5h to 2.5h in the first week.

I run **BusyBits**, a newsletter read by 100,000+ high-performance founders and executives.
My audience is obsessed with biohacking and productivity leverage.
They are exactly the type of people who will pay $2k+ to optimize their recovery.

I’m planning my Q2 sponsorship calendar and wanted to see if Eight Sleep would be open to testing a placement?
I’d love to write a native endorsement about how I use the Pod to "buy back time" through better sleep efficiency.

Open to a quick chat next week?

Best,
Ziga
Founder, BusyBits'''
    },
    {
        'company': 'Oura Ring',
        'email': 'press@ouraring.com',
        'target_name': 'Tom Hale',
        'subject': 'My Readiness Score today is 92 (Thanks to Oura)',
        'body_template': '''Hey [Name],

I check my Readiness Score before I check my email.
Oura has completely changed how I schedule my deep work blocks. If my score is low, I push the heavy lifting to tomorrow.

I write **BusyBits**, a newsletter for 100k+ founders/execs focused on peak performance.
My readers are data-driven. They love quantifying their health.
I think a campaign focused on "Data-Driven Energy Management" would crush it with this audience.

Are you the right person to chat with about a Q2 partnership test?
(If not, could you point me in the right direction?)

Thanks,
Ziga'''
    },
    {
        'company': 'Whoop',
        'email': 'press@whoop.com',
        'target_name': 'Will Ahmed',
        'subject': 'Strain vs. Recovery (Partnership Idea)',
        'body_template': '''Hey [Name],

Huge fan of the 4.0. The "Strain" metric is the only thing that actually gets me to stop working and go to sleep.

I run **BusyBits**, a newsletter for 100,000+ high-performance entrepreneurs.
Our entire ethos is about sustainable output—avoiding burnout while scaling companies.
Whoop is the perfect tool for that narrative.

I’d love to feature Whoop as the "Burnout Prevention System" for my readers in an upcoming issue.
Do you have any budget left for Q2 newsletter sponsorships?

Best,
Ziga'''
    },
    {
        'company': 'Levels',
        'email': 'press@levelshealth.com',
        'target_name': 'Sam Corcos',
        'subject': 'The 3pm Crash (Solvable with Levels)',
        'body_template': '''Hey [Name],

I recently wore a CGM and realized my "healthy" oatmeal breakfast was spiking me to 160 mg/dL and causing my afternoon brain fog.
Levels made that invisible problem visible.

I write **BusyBits**, a newsletter for 100k+ subscribers.
My audience is constantly asking how to maintain focus throughout the day.
I want to show them that it’s a biology problem, not a willpower problem—and that Levels is the fix.

I’m booking out Q2 slots now. Would you be open to a test campaign?
I think the "Metabolic Focus" angle would convert incredibly well here.

Cheers,
Ziga'''
    },
    {
        'company': 'Apollo Neuro',
        'email': 'press@apolloneuro.com',
        'target_name': 'Kathryn Fantauzzi',
        'subject': 'HRV Training for Founders',
        'body_template': '''Hey [Name],

I’ve been using Apollo’s "Focus" mode during my deep work blocks and "Relax" for wind-down.
It’s rare to find a wearable that actually *changes* your state rather than just tracking it.

I run **BusyBits**, a newsletter for 100,000+ stressed-out high achievers.
Stress management is a massive pain point for my readers.
They are looking for tool-based solutions, not just meditation advice.

I’d love to introduce Apollo to my audience as the "Stress Switch" for entrepreneurs.
Are you testing newsletter channels for Q2?

Best,
Ziga'''
    }
]

SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'ziga@example.com')  # Update with real email
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
SMTP_SERVER = 'smtp.gmail.com'
PORT = 587

def send_email(to_email, subject, body, dry_run=True):
    print(f"=== DRY RUN EMAIL ({'SENT' if not dry_run else 'SKIPPED'}) ===")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    print(body)
    print("=== END EMAIL ===\\n")
    if not dry_run:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        try:
            server = smtplib.SMTP(SMTP_SERVER, PORT)
            server.starttls()
            server.login(SENDER_EMAIL, EMAIL_PASSWORD)
            text = msg.as_string()
            server.sendmail(SENDER_EMAIL, to_email, text)
            server.quit()
            print("Email sent successfully!")
        except Exception as e:
            print(f"Failed to send: {e}")

if __name__ == "__main__":
    dry_run = True  # Change to False to send for real
    for comp in companies:
        name = comp['target_name'].split()[0]
        body = comp['body_template'].replace('[Name]', name)
        send_email(comp['email'], comp['subject'], body, dry_run)
