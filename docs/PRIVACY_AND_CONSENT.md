# Privacy and Consent Draft Templates

**Draft only. Review with local legal counsel before use. This is not legal advice.**

These templates are written for a UAE-oriented deployment and should be adapted to the company, jurisdiction, and exact operational model.

## 1) Driver consent form

**Title:** Driver Location, Safety, and Communications Consent

By signing this form, I acknowledge that:

1. I understand the company uses location tracking during active duty and trip operations.
2. I understand that the driver web / future mobile client shows a visible tracking indicator while tracking is active.
3. I understand tracking is not intended for private time outside an active duty or assigned trip.
4. I consent to the collection of:
   - location coordinates
   - speed and heading
   - battery level, network status, and device connectivity indicators where available
   - SOS and safety-related events
5. I understand these records may be reviewed by authorized administrators and dispatchers for safety, operations, compliance, and incident response.
6. I understand the company may retain safety records for the retention period described in the data retention policy.

**Driver name:** ____________________

**Employee ID:** ____________________

**Date:** ____________________

**Signature:** ____________________

## 2) Company monitoring policy

**Purpose**

The company monitors drivers for operational safety, fleet coordination, incident response, and compliance.

**Scope**

Monitoring applies to:

- active duty periods
- assigned trips
- SOS and emergency workflows
- safety-related communications

**Rules**

1. Monitoring must be visible to the driver.
2. Monitoring must not be used for private-time tracking.
3. Access to driver data is role-based and limited to business need.
4. Admin and dispatcher access should be logged.
5. Safety alerts should be handled promptly.

## 3) Data retention policy

Suggested draft retention periods:

- Location pings and trip routes: 90 days to 12 months depending on operational need
- SOS alerts: 12 months to 24 months
- Access logs: 12 months to 24 months
- Authentication logs: keep only as long as operationally necessary

Retention should be shortened or extended only where required by law, insurance, litigation hold, or internal policy.

## 4) Camera / audio usage policy for future WebRTC phase

This policy is for a future phase and should not be enabled until formally approved.

Draft principles:

1. Camera and audio capture are only for safety, incident response, and operational support.
2. Camera/audio should only be enabled with clear driver notice.
3. Recording should be disabled unless explicitly authorized.
4. Live access should be restricted to approved roles.
5. Session access should be logged.
6. Capture should be disabled outside active duty unless a specific, documented safety incident requires it.

## 5) Role-based access policy

**Driver**

- can view own duty/trip state
- can submit location and SOS events

**Dispatcher**

- can view drivers and trips
- can acknowledge and resolve SOS alerts

**Administrator**

- can view and manage all operational safety data
- can access audit logs

Minimum access should be granted by default.

## 6) Driver-visible tracking indicator requirement

The system must clearly indicate when tracking is active.

Recommended drafting:

> During active duty or trip operations, the driver client will display a persistent, visible tracking indicator showing that location data is being collected and transmitted for safety and dispatch purposes.

## 7) No private-time tracking rule

Recommended drafting:

> The company shall not collect or transmit location data when the driver is off duty or otherwise not engaged in an active trip, except where required by law or where the driver has given a separate, specific, documented consent for a narrowly defined safety purpose.
