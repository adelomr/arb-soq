# Google Play Store - SMS Permission Justification

## App Purpose
SMS Gateway Pro is a **core SMS functionality app** that provides SMS gateway services via HTTP API.

## SMS Permissions Used

### 1. SEND_SMS
- **Purpose**: Send SMS messages via API requests
- **Core Function**: This is the primary function of the app
- **Usage**: Only when user explicitly requests SMS sending through API calls
- **No Ads**: Not used for advertising purposes
- **No Tracking**: Not used for user tracking

### 2. READ_PHONE_STATE
- **Purpose**: Check SIM card status and availability
- **Core Function**: Required to determine which SIM to use for sending SMS
- **Usage**: Only to check if device has active SIM cards
- **No Ads**: Not used for advertising purposes
- **No Tracking**: Not used for user tracking

## Removed Permissions
- **READ_SMS**: Removed as not essential for SMS Gateway functionality
- **RECEIVE_SMS**: Removed as not essential for SMS Gateway functionality

## Compliance with Google Play Policies

### ✅ Core Function Only
- App's primary purpose is SMS sending via API
- All SMS permissions used only for this core function
- No secondary or non-core functionality

### ✅ No Ads
- App contains no advertisements
- No ad networks integrated
- No revenue from ads

### ✅ No Tracking
- No user tracking or analytics
- No data collection for marketing
- All data stored locally on device

### ✅ No Non-Core Functionality
- App does not use SMS permissions for:
  - Marketing
  - Analytics
  - User profiling
  - Data collection
  - Any purpose other than SMS sending

## Technical Implementation
- SMS sending only occurs when explicitly requested via HTTP API
- All SMS operations are logged locally for debugging
- No external data transmission
- User has full control over when SMS are sent

## Data Privacy
- All data stored locally on device
- No external servers involved
- User can clear all data at any time
- No personal information collected

## Conclusion
This app uses SMS permissions **exclusively** for its core SMS Gateway functionality. It complies with all Google Play Store policies regarding SMS/Call Log access and does not use these permissions for ads or non-core functionality.
