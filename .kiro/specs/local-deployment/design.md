# Design Document

## Overview

The local deployment design focuses on setting up a uni-app Vue 2 based cashier system that connects to the online API at https://www.vdamo.com. The system uses HBuilderX as the development environment and supports multiple platforms (H5, Android, iOS) with responsive design for different screen sizes (phone, pad, cash register, PC).

## Architecture

### Technology Stack
- **Framework**: uni-app (cross-platform development framework)
- **Frontend**: Vue 2.x
- **UI Library**: uView UI components
- **State Management**: Vuex
- **Internationalization**: vue-i18n
- **Real-time Communication**: WebSocket
- **Build Tool**: HBuilderX
- **Styling**: SCSS/SASS

### System Components
```
┌─────────────────────────────────────────┐
│              Frontend (uni-app)          │
├─────────────────────────────────────────┤
│  Vue 2 + uView UI + Vuex + i18n        │
├─────────────────────────────────────────┤
│           API Layer (/api)              │
├─────────────────────────────────────────┤
│         Configuration Layer             │
│      (custom/siteroot.js)               │
├─────────────────────────────────────────┤
│         WebSocket Connection            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        Online API Server               │
│      (https://www.vdamo.com)            │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Configuration Management
- **File**: `custom/siteroot.js`
- **Purpose**: Environment-based API endpoint configuration
- **Key Features**:
  - Automatic environment detection (development/production)
  - API root URL configuration
  - Screen URL configuration for dual-display support

### 2. API Layer
- **Location**: `/api` directory
- **Structure**:
  - `core.js`: Authentication and core operations
  - `goods.js`: Product management APIs
  - `order.js`: Order processing APIs
  - `store.js`: Store management APIs
  - `seeting.js`: Settings and configuration APIs

### 3. Request Handler
- **File**: `common/request.js`
- **Purpose**: Centralized HTTP request management
- **Features**:
  - Request/response interceptors
  - Error handling
  - Token management
  - CORS handling

### 4. WebSocket Integration
- **File**: `common/socket.js`
- **Purpose**: Real-time communication for order notifications
- **Features**:
  - Auto-reconnection
  - Voice notifications
  - MQTT message handling

### 5. Multi-platform Support
- **Responsive Design**: Supports phone, pad, cash register, and PC layouts
- **Platform Detection**: Automatic screen size detection and UI adaptation
- **Native Plugins**: Support for printing, serial communication, dual-display

## Data Models

### Configuration Model
```javascript
{
  version: string,
  screenurl: string,
  siteroot: string
}
```

### API Endpoints Structure
```javascript
{
  login: '/channel/login',
  profix: '/channel/profix',
  statistics: '/channel/statistics',
  member: '/channel/member',
  // ... other endpoints
}
```

### Device Detection Model
```javascript
{
  phone: boolean,    // 0-500px
  pad: boolean,      // 500-1150px
  cash: boolean,     // 1150-1500px
  pc: boolean        // 1500-3280px
}
```

## Error Handling

### 1. Network Error Handling
- Connection timeout handling
- Retry mechanisms for failed requests
- Offline mode detection
- Graceful degradation for network issues

### 2. API Error Handling
- HTTP status code handling (401, 403, 404, 500, etc.)
- Business logic error responses
- User-friendly error messages
- Error logging and reporting

### 3. WebSocket Error Handling
- Connection failure recovery
- Message parsing error handling
- Audio playback error handling
- Reconnection strategies

## Testing Strategy

### 1. Development Environment Testing
- Local server setup verification
- API connectivity testing
- WebSocket connection testing
- Multi-platform responsive testing

### 2. Integration Testing
- Online API integration verification
- Authentication flow testing
- Real-time notification testing
- Cross-platform compatibility testing

### 3. Performance Testing
- API response time monitoring
- WebSocket message latency testing
- Memory usage optimization
- Battery usage optimization (mobile)

### 4. User Acceptance Testing
- Core cashier functionality testing
- Member management testing
- Order processing workflow testing
- Multi-language support testing

## Implementation Considerations

### 1. Development Setup
- HBuilderX IDE configuration
- Node.js and npm/yarn setup
- uni-app CLI tools installation
- Development server configuration

### 2. Environment Configuration
- Development vs production API endpoints
- CORS configuration for local development
- WebSocket URL configuration
- Native plugin setup for testing

### 3. Build and Deployment
- H5 build configuration for web deployment
- Android/iOS build setup for mobile testing
- Asset optimization and compression
- Multi-platform build automation

### 4. Security Considerations
- API token management
- Secure WebSocket connections (WSS)
- Input validation and sanitization
- Cross-site scripting (XSS) prevention