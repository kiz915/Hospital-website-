# Security Spec: Hospital Workspace Core

## Data Invariants
1. A patient cannot book an appointment for another patient (patientId must match user auth UID).
2. A patient cannot update their own role (e.g. self-escalate from 'patient' to 'admin').
3. A patient can search/view doctors but cannot modify, delete, or create any doctor records.
4. A patient can upload reports and schedule appointments but can only access (view, update, or list) their own appointments and reports.
5. An Admin (bootstrapped with email `25it161@skcet.ac.in`) has complete root access to all collections and can manage, filter, and modify any records.

## The Dirty Dozen Payloads
1. **Self-Escalation Attack**: User attempts to create a profile with `"role": "admin"`.
2. **Identity Spoofing in Appointment**: User attempts to book an appointment with `patientId` set to another user's UID.
3. **Dr. Ransom Doctor Hijack**: User attempts to create a doctor profile without admin privileges.
4. **Sneaky Status Update**: Patient tries to bypass approval and update their appointment status directly to `"confirmed"`.
5. **PII Intrusion**: Authenticated patient tries to read another patient's medical report matching a different UID.
6. **Report Splicing**: Patient tries to update a report to point to a different `patientId` to inject malicious data.
7. **Bypass ID Sanitization**: Injecting a extremely long/dangerous sequence (e.g. 1.5MB path strings) as a document ID.
8. **Spoofed Admin Session**: Patient tries to send write with `email_verified: false` spoofing an admin email check.
9. **Spamming Slots**: Creating appointments with invalid past/future timestamps or missing critical fields.
10. **Ghost Fields Update**: Including a property `isVipPatient: true` inside a standard appointment update.
11. **Immutability Breach**: Patient attempts to change `createdAt` timestamp of a booked appointment.
12. **Foreign Admin Deletion**: Regular patient attempts to delete another patient's active medical report.
