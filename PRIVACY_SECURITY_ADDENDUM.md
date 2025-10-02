# Privacy & Security Addendum
## DocuBuild Document Management System

**Effective Date:** October 2, 2025
**Provider:** Jan Ver Santos
**Service:** DocuBuild (Cloud-Based Document Management)

---

## 1. Data Security Architecture

### 1.1 Infrastructure Overview
DocuBuild uses enterprise-grade cloud infrastructure:

| Component | Provider | Certification | Location |
|-----------|----------|---------------|----------|
| **Application Hosting** | Vercel | SOC 2 Type II | Global CDN |
| **Database & Storage** | Supabase | SOC 2 Type II, ISO 27001 | Singapore Region |
| **Authentication** | Supabase Auth | GDPR Compliant | Singapore Region |
| **File Storage** | Supabase Storage | Encrypted at Rest | Singapore Region |

**Why Singapore Region:**
- Closest geographic location to Philippines
- Lowest latency for fast access
- ASEAN data privacy standards
- Same region many PH banks use for backups

### 1.2 Security Certifications
Our infrastructure providers maintain:
- **SOC 2 Type II:** Audited security controls (same standard as major banks)
- **ISO 27001:** Information security management certification
- **GDPR Compliance:** European data protection standards
- **AICPA Standards:** Financial-grade security and availability

**Translation:** Same security level as BDO, BPI, Metrobank online banking platforms.

---

## 2. Data Protection Measures

### 2.1 Encryption Standards

**Data in Transit (Moving Between You and Server):**
- **Protocol:** TLS 1.3 (latest standard)
- **Encryption:** 256-bit encryption
- **Certificate:** SHA-256 with RSA
- **What this means:** Data encrypted during upload/download, cannot be intercepted

**Data at Rest (Stored on Servers):**
- **Encryption:** AES-256 encryption
- **Key Management:** Managed by Supabase infrastructure
- **Database:** PostgreSQL with encrypted storage
- **What this means:** Even if someone physically steals a server, data is unreadable

**Password Security:**
- **Hashing:** bcrypt with salt (industry standard)
- **Storage:** Only hashed passwords stored, never plain text
- **Sessions:** JWT tokens with expiration
- **What this means:** We cannot see your password, even in database

### 2.2 Access Control

**Application-Level Security:**
- ✅ **Role-Based Access Control (RBAC):** Users only see what they're permitted to
- ✅ **Row-Level Security (RLS):** Database enforces permissions (cannot be bypassed)
- ✅ **Session Management:** Auto-logout after 30 minutes of inactivity
- ✅ **Login Tracking:** Record IP address, device, timestamp of each login
- ✅ **Failed Login Protection:** Account locked after 5 failed attempts

**Data Isolation:**
- Each client's data completely isolated from other clients
- Database-level separation (not just application logic)
- No possibility of cross-client data access
- Impossible for Company A to see Company B's files

### 2.3 Network Security
- **Firewall:** Cloud provider firewall rules
- **DDoS Protection:** Automatic DDoS mitigation
- **Rate Limiting:** Prevents brute-force attacks
- **IP Logging:** All access attempts logged
- **API Security:** Authenticated API endpoints only

---

## 3. Privacy Guarantees & Data Ownership

### 3.1 Your Data Ownership
**You own 100% of your data. Specifically:**

✅ **Documents:** All uploaded files remain your property
✅ **Metadata:** Project names, categories, tags, descriptions
✅ **User Data:** Employee names, emails, roles
✅ **Audit Logs:** Complete history of all actions
✅ **Generated Data:** Reports, exports, backups

**We (provider) claim ZERO ownership or rights to your business data.**

### 3.2 What We NEVER Do

❌ **NEVER access your files** without written permission (except technical emergencies)
❌ **NEVER sell or share your data** with third parties, advertisers, or data brokers
❌ **NEVER use your documents** for training AI models or machine learning
❌ **NEVER show your data** in marketing materials or demos (without consent)
❌ **NEVER mine your data** for business intelligence or competitive research

### 3.3 When We MAY Access Data (Rare Cases)

✅ **Technical Support:** Only with your written permission to troubleshoot issues
✅ **Legal Obligation:** If required by valid court order (we notify you first if legally permitted)
✅ **Security Incident:** To investigate breach or abuse of system
✅ **Backup Restoration:** To restore your data if requested

**In all cases:** Access is logged, minimal, and you are notified.

### 3.4 Data Processing Agreement (DPA)

We comply with Philippine Data Privacy Act (RA 10173) as Data Processor:

**Our Role:** Process data only on your instructions
**Your Role:** Data Controller (you decide what data is collected and why)

**DPA Includes:**
- Purpose and duration of processing
- Types of personal data processed
- Rights of data subjects (your employees/clients)
- Sub-processor disclosure (Supabase, Vercel)
- Security measures implemented
- Breach notification procedures
- Data retention and deletion policies

**Separate DPA document provided upon contract signing.**

---

## 4. Compliance & Regulatory Standards

### 4.1 Philippine Data Privacy Act (RA 10173)

DocuBuild complies with:
- **Lawful Processing:** Data processed only for legitimate business purposes
- **Consent:** Users informed of data collection via privacy policy
- **Data Subject Rights:** Access, correction, deletion, portability
- **Security Measures:** Organizational and technical safeguards
- **Breach Notification:** Client notified within 72 hours of discovery
- **Retention Limits:** Data deleted per agreed schedule

### 4.2 Government Contract Compliance

Suitable for government contractors requiring:
- ✅ **Audit Trail:** 7-year retention of all document actions
- ✅ **Immutable Logs:** Cannot be edited or deleted
- ✅ **Access Records:** Who viewed what and when
- ✅ **Approval History:** Complete chain of custody
- ✅ **Export Capability:** Audit reports in PDF/CSV
- ✅ **Timestamp Verification:** Server-side timestamps (cannot be forged)

### 4.3 Industry Best Practices

Aligned with:
- **ISO 27001:** Information security management
- **NIST Framework:** Cybersecurity framework
- **OWASP Top 10:** Web application security
- **SANS Security:** Critical security controls

---

## 5. Backup & Disaster Recovery

### 5.1 Backup Schedule

**Automated Backups:**
- **Frequency:** Daily (every 24 hours)
- **Time:** 2:00 AM Philippine Time (low-usage period)
- **Retention:** Last 30 days of backups kept
- **Scope:** Full database + all files

**Backup Security:**
- Encrypted using AES-256
- Stored in separate geographic location (redundancy)
- Access controlled (cannot be publicly accessed)
- Tested quarterly for restorability

### 5.2 Disaster Recovery

**In case of data loss:**
- **Recovery Time Objective (RTO):** 24 hours
- **Recovery Point Objective (RPO):** Last daily backup (max 24 hours data loss)
- **Process:** Restore from most recent backup
- **Notification:** Client notified immediately if disaster recovery initiated

**High Availability:**
- Multiple server redundancy
- Automatic failover if primary server fails
- 99% uptime target (allowable downtime: ~7 hours/month)

### 5.3 Client-Side Backups (Recommended)

**We recommend you also:**
- Export critical documents weekly to local storage
- Download audit logs monthly
- Keep offline copies of essential files (USB/NAS)

**Why:** Defense-in-depth strategy (multiple backup layers)

---

## 6. Data Retention & Deletion

### 6.1 Active Service Retention

**While you're a paying client:**
- All data retained indefinitely
- No automatic deletion
- You control what to delete and when
- Audit logs retained for 7 years (government compliance)

### 6.2 Service Termination

**If you cancel subscription:**

**30-Day Grace Period:**
- Account marked for deletion but not deleted yet
- You can still login and export all data
- No new uploads allowed
- Download access fully functional

**After 30 Days:**
- All data permanently deleted from production servers
- Backups deleted from backup storage
- User accounts deactivated
- System logs retained for 90 days (security purposes only)

**After 120 Days:**
- Complete purge from all systems
- Certificate of deletion provided upon request

### 6.3 Data Deletion Procedures

**Standard Deletion (Normal Files):**
- Removed from active database
- Overwritten in next backup cycle
- Meets industry standards for secure deletion

**Secure Deletion (Upon Request):**
- DoD 5220.22-M standard (3-pass overwrite)
- Cryptographic erasure of encryption keys
- Additional fee: ₱5,000 for secure deletion certification

### 6.4 Right to Data Portability

**You can export anytime:**
- **Documents:** Original files in original formats (PDF, DOCX, JPG, etc.)
- **Metadata:** CSV export (projects, categories, users, tags)
- **Audit Logs:** CSV or PDF export (all historical actions)
- **Structure:** Folder structure preserved in export

**No fees for export during active subscription.**

---

## 7. Security Incident Response

### 7.1 Incident Detection

**We monitor for:**
- Unauthorized access attempts
- Unusual data access patterns
- Multiple failed login attempts
- Malware or virus uploads
- DDoS attacks
- Server vulnerabilities

**Monitoring Tools:**
- Automated intrusion detection
- Log analysis (daily review)
- Security alerts from Supabase/Vercel
- Third-party security scanning

### 7.2 Breach Notification

**If security incident occurs:**

**Within 24 Hours:**
- Internal investigation initiated
- Scope of breach assessed
- Containment measures deployed

**Within 72 Hours:**
- Client notified via email and phone
- Details provided: What happened, what data affected, what we're doing
- Recommendations for client action

**Ongoing:**
- Regular updates until resolved
- Post-incident report with root cause analysis
- Remediation plan to prevent recurrence

**What We Tell You:**
- Date/time of incident
- Type of data potentially affected
- Number of users/documents impacted
- Actions we've taken
- Actions you should take (e.g., password reset)

### 7.3 Your Responsibilities

**To maintain security, you should:**
- ✅ Use strong passwords (min 12 characters, mix of types)
- ✅ Don't share login credentials
- ✅ Revoke access for former employees immediately
- ✅ Report suspicious activity
- ✅ Keep your devices secure (antivirus, OS updates)
- ✅ Don't access from public/unsecured WiFi (use VPN)

---

## 8. Third-Party Sub-Processors

### 8.1 Sub-Processors We Use

| Service | Purpose | Data Access | Location | Compliance |
|---------|---------|-------------|----------|------------|
| **Supabase** | Database, storage, auth | Full access | Singapore | SOC 2, ISO 27001, GDPR |
| **Vercel** | Application hosting | Application code only | Global CDN | SOC 2, ISO 27001 |
| **Gmail/Email** | Notifications, support | Email addresses only | Global | GDPR compliant |

**No other third parties have access to your data.**

### 8.2 Sub-Processor Security

All sub-processors:
- ✅ Maintain equivalent or better security standards
- ✅ Sign Data Processing Agreements (DPAs)
- ✅ Undergo regular security audits
- ✅ Comply with GDPR and international standards
- ✅ Cannot use your data for their own purposes

### 8.3 Sub-Processor Changes

**If we add or change sub-processors:**
- 30-day advance notice to clients
- Right to object (can terminate contract if unacceptable)
- Updated list published at [your website]/subprocessors

---

## 9. Enhanced Security Options (Paid Add-Ons)

### 9.1 Standard Security (Included)
Everything described in this document included at no extra charge.

### 9.2 Privacy Plus Tier (+₱5,000/month)

**Client-Side Encryption:**
- Files encrypted on YOUR computer before upload
- Decryption key derived from your password
- Even we cannot read files without your password
- Zero-knowledge architecture

**Two-Factor Authentication (2FA):**
- SMS or authenticator app (Google Authenticator, Authy)
- Required for all users or admin only (your choice)
- Backup codes for recovery

**IP Whitelisting:**
- Only specified IP addresses can login
- Block access from outside office network
- VPN access supported

**Advanced Audit Alerts:**
- Email notification on suspicious activity
- Login from new device/location alerts
- Large file download alerts
- Customizable alert rules

**Weekly Backup Downloads:**
- Automated encrypted backup sent to your email
- Self-service restore capability
- Additional protection layer

### 9.3 Enterprise Privacy Tier (+₱20,000/month)

Everything in Privacy Plus, plus:

**Dedicated Database Instance:**
- Not shared infrastructure (your own server)
- Guaranteed resources (no "noisy neighbor" issues)
- Custom performance tuning

**Custom Data Retention Policies:**
- Define your own retention rules
- Automatic archival of old projects
- Compliance with your specific regulations

**Enhanced Support:**
- 4-hour response time (vs 24-hour standard)
- Direct phone support
- Quarterly security review calls

**Legal Compliance Package:**
- Customized DPA for your industry
- BAA (Business Associate Agreement) if needed
- Compliance certification letters

---

## 10. Your Privacy Rights

Under Philippine Data Privacy Act, you have the right to:

### 10.1 Right to Information
- Know what personal data is collected
- Understand how data is processed
- See who has access to data

**How to exercise:** Request privacy report via email

### 10.2 Right to Access
- View all data stored about your organization
- Get copy of all files and metadata
- Review audit logs

**How to exercise:** Export feature in dashboard or email request

### 10.3 Right to Correction
- Update incorrect information
- Modify user details
- Correct metadata errors

**How to exercise:** Edit directly in application or email request

### 10.4 Right to Erasure
- Delete specific documents
- Remove user accounts
- Request complete data deletion

**How to exercise:** Delete feature in app or written termination notice

### 10.5 Right to Object
- Object to data processing
- Withdraw consent for optional features
- Opt-out of marketing communications (if any)

**How to exercise:** Email privacy@[yourdomain] with objection

### 10.6 Right to Data Portability
- Export data in standard formats
- Transfer to another system
- No vendor lock-in

**How to exercise:** Export button in dashboard (available anytime)

---

## 11. Children's Privacy

DocuBuild is a **business application not intended for children.**

- Not designed for users under 18
- No personal data knowingly collected from minors
- If minor data discovered, immediately deleted upon notification

---

## 12. Changes to Privacy & Security

### 12.1 Material Changes
If we make significant security changes:
- 30-day advance email notice
- Summary of what changed and why
- Right to terminate if unacceptable

**Material changes include:**
- New sub-processors
- Data location changes
- Reduced security measures

### 12.2 Non-Material Changes
Minor updates (improved security, bug fixes):
- Updated document posted online
- No notice required (improvements only)

---

## 13. Contact & Questions

### 13.1 Privacy Questions
**Privacy Officer:** Jan Ver Santos
**Email:** [your-email@example.com]
**Phone:** [your-phone-number]
**Response Time:** Within 48 hours

### 13.2 Security Concerns
**Report Security Issues:**
**Email:** security@[yourdomain] (if you have separate email)
**Or:** [your-email@example.com] with subject "SECURITY ISSUE"
**Response Time:** Within 12 hours for critical issues

### 13.3 Data Subject Requests
To exercise privacy rights:
**Email:** [your-email@example.com]
**Subject Line:** "Privacy Rights Request - [Company Name]"
**Include:** Specific request, authorization if from employee
**Response Time:** Within 15 days (per Philippine law)

---

## 14. Acknowledgment

By signing the DocuBuild service contract or trial agreement, you acknowledge:

✅ You have read and understand this Privacy & Security Addendum
✅ You accept the security measures and infrastructure described
✅ You understand data is stored on cloud servers (Singapore region)
✅ You agree to the data retention and deletion policies
✅ You understand your privacy rights and how to exercise them

---

**Document Version:** 1.0
**Last Updated:** October 2, 2025
**Next Review:** April 2, 2026

**Questions about this addendum?**
Email [your-email] or schedule a call to discuss security requirements.

---

*This document is part of the DocuBuild service agreement. In case of conflict between this addendum and main contract, the more protective provision for client data applies.*
