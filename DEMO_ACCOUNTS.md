# 🎭 GoSafe Demo Accounts

## Quick Access Credentials

All demo accounts use the same password: **Demo@123**

---

### 👤 Passenger Account
- **Email:** passenger@demo.com
- **Password:** Demo@123
- **Special ID:** GSAFE-PASS001
- **Use for:** Testing incident reporting, bus requests, passenger features

---

### 🚗 Driver Account
- **Email:** driver@demo.com
- **Password:** Demo@123
- **Special ID:** GSAFE-DRV001
- **License:** DL-DEMO-001
- **Vehicle:** GT-DEMO-20
- **Use for:** Testing driver dashboard, ride management

---

### 👨‍💼 Admin Account (DVLA)
- **Email:** admin@demo.com
- **Password:** Demo@123
- **Special ID:** GSAFE-ADM001
- **Office:** DVLA Accra Central (DVLA-ACC-001)
- **Use for:** Testing admin dashboard, approvals, reports

---

### 🚑 Emergency Service (Ambulance)
- **Email:** ambulance@demo.com
- **Password:** Demo@123
- **Special ID:** GSAFE-EMG001
- **Registration:** REG-AMB-001
- **Status:** Approved & Available
- **Use for:** Testing emergency response features

---

### 🚛 Towing Service
- **Email:** towing@demo.com
- **Password:** Demo@123
- **Special ID:** GSAFE-TOW001
- **Registration:** REG-TOW-001
- **Status:** Approved & Available
- **Use for:** Testing towing service features

---

## How to Create Demo Accounts

1. Open phpMyAdmin
2. Go to SQL tab
3. Run the file: `scripts/CREATE_DEMO_ACCOUNTS.sql`
4. All demo accounts will be created

---

## Testing Scenarios

### Scenario 1: Report an Incident
1. Login as **passenger@demo.com**
2. Create incident report
3. Login as **admin@demo.com**
4. Review and respond to incident

### Scenario 2: Request Emergency Service
1. Login as **passenger@demo.com**
2. Report emergency incident
3. Login as **ambulance@demo.com**
4. Respond to emergency

### Scenario 3: Request Bus
1. Login as **passenger@demo.com**
2. Submit bus request
3. Login as **driver@demo.com**
4. Accept and complete request

### Scenario 4: Admin Approval
1. Login as **admin@demo.com**
2. View pending approvals
3. Approve/reject requests

---

## Password Reset Testing

All accounts have special IDs for password recovery:
- Use the special ID instead of email for password reset
- Example: GSAFE-PASS001, GSAFE-DRV001, etc.

---

## Notes

- All demo accounts are pre-approved (no waiting for admin approval)
- Driver and emergency services are set to "available" status
- Admin is linked to DVLA Accra Central office
- Safe to delete and recreate anytime using the SQL script

---

## Delete Demo Accounts

If you want to remove all demo accounts:

```sql
DELETE FROM passengers WHERE email = 'passenger@demo.com';
DELETE FROM drivers WHERE email = 'driver@demo.com';
DELETE FROM administrators WHERE email = 'admin@demo.com';
DELETE FROM emergency_services WHERE email = 'ambulance@demo.com';
DELETE FROM towing_services WHERE email = 'towing@demo.com';
```
