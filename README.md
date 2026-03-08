# User & Admin Guide

Welcome to the AI Studio! This guide will help you understand how to use the platform, whether you are a regular user or a system administrator.

## 🌟 Features

- **Multi-Model Support**: Access various AI models (like GPT-3.5, GPT-4, etc.) through a unified interface.
- **API Key Management**: Generate and manage your own API keys for programmatic access.
- **Built-in Chatbot**: Chat with AI models directly from the web interface.
- **Points System**: Administrators can allocate points to users to control usage.
- **Internationalization (i18n)**: Support for English and Chinese languages.
- **Secure**: Built-in rate limiting, password hashing, and secure API proxying.

---

## 👨‍💻 For Users (Members)

### 1. Registration & Login
- Go to the **Login** page. You can switch the language using the globe icon in the top right corner.
- If you don't have an account, click **Sign up**.
- You will need to verify your email address. (Note: The administrator must configure the SMTP settings first for emails to be sent).

### 2. Dashboard
- View your **Available Points**, **Total Requests**, and **Tokens Used**.
- See your **Recent Activity** to track which models you used and how many points were deducted.

### 3. AI Chat Assistant
- Navigate to the **Chatbot** tab.
- Type your message and chat with the AI.
- **Export Chat**: You can click the "Export" button in the top right corner of the chat window to download your conversation history as a `.txt` file.

### 4. Settings & API Keys
- Go to the **Settings** tab.
- **API Key**: Here you can view your personal API key. You can use this key to make requests to the `/v1/chat/completions` endpoint (OpenAI compatible).
- **Reset Key**: If your key is compromised, click "Reset Key" to generate a new one.
- **Change Password**: Update your account password securely.

---

## 🛡️ For Administrators

Administrators have access to the **Admin Dashboard** (`/xiaoxiaomiadmin`), which provides full control over the system.

### 1. System Settings (SMTP & Defaults)
- Navigate to **Admin -> Settings**.
- **Gmail Preset**: To quickly set up email verification, click the **"Apply Gmail Preset"** button.
  - It will auto-fill `smtp.gmail.com` and port `587`.
  - You only need to enter your Gmail address in **SMTP User** and an **App Password** in **SMTP Password**.
  - *(Note: You must generate an "App Password" from your Google Account settings. Regular passwords will not work for SMTP).*
- **Default User Points**: Set the initial points given to newly registered users.

### 2. User Management
- Navigate to **Admin -> Users**.
- View all registered users, their roles, points, and active status.
- You can toggle a user's active status (suspend/activate) and manually adjust their points or daily limits.

### 3. Model Management
- Navigate to **Admin -> Models**.
- Add new upstream AI models (e.g., from OpenAI, Anthropic, or custom endpoints).
- Configure the pricing per token or per request.
- Assign models to specific users so they can access them.

### 4. Logs & Monitoring
- Navigate to **Admin -> Logs**.
- View detailed system logs, including which user made requests, which model was used, token consumption, and point deductions.

---

## 🔧 API Usage (For Developers)

The platform provides an OpenAI-compatible API endpoint.

**Endpoint**: `https://<your-app-url>/v1/chat/completions`

**Headers**:
```http
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

**Body**:
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ]
}
```

