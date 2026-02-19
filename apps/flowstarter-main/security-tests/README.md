# Security Testing Suite for Flowstarter

This directory contains security testing scripts to identify common vulnerabilities in the Flowstarter platform.

## 🎯 What's Tested

### 1. IDOR (Insecure Direct Object Reference)
- ✅ Project access control without authentication
- ✅ Cross-user project access attempts
- ✅ Unauthorized project modifications
- ✅ Unauthorized project deletions
- ✅ Draft project access control

### 2. Input Validation & XSS
- ✅ Cross-Site Scripting (XSS) payloads
- ✅ SQL Injection attempts
- ✅ Command Injection
- ✅ Path Traversal
- ✅ Input length validation
- ✅ Special characters handling

### 3. Authentication & Authorization
- ✅ API endpoint authentication requirements
- ✅ Token validation
- ✅ Session management

## 🚀 Quick Start

### Prerequisites
- PowerShell 5.1 or higher
- Your Flowstarter application running locally on `localhost:3000` (or specify a different URL)

### Running the Tests

#### Test 1: IDOR Vulnerabilities

**Bash (Linux/macOS/CI):**
```bash
cd security-tests
chmod +x test-idor.sh
./test-idor.sh
```

**PowerShell (Windows):**
```powershell
cd security-tests
.\test-idor.ps1
```

**With custom URL:**
```bash
BASE_URL="http://localhost:3000" ./test-idor.sh
```

#### Test 2: Input Validation & XSS

**Bash (Linux/macOS/CI):**
```bash
cd security-tests
chmod +x test-input-validation.sh
./test-input-validation.sh
```

**PowerShell (Windows):**
```powershell
cd security-tests
.\test-input-validation.ps1
```

**With custom URL:**
```bash
BASE_URL="http://localhost:3000" ./test-input-validation.sh
```

## 📊 Understanding the Results

### Severity Levels

- 🔴 **CRITICAL**: Immediate security risk requiring urgent attention
- 🟠 **HIGH**: Significant security vulnerability
- 🟡 **MEDIUM**: Moderate security concern
- 🟢 **LOW**: Minor security issue or best practice recommendation
- ℹ️ **INFO**: Informational findings or passing tests

### Test Status

- ✅ **PASS**: Test passed, no vulnerability detected
- ⚠️ **WARNING**: Potential issue requiring review
- 🔴 **FAIL**: Vulnerability detected
- ℹ️ **REVIEW**: Manual review recommended

## 📄 Reports

Each test generates a JSON report in the current directory with timestamps:
- `idor-test-report-YYYYMMDD-HHMMSS.json`
- `input-validation-report-YYYYMMDD-HHMMSS.json`

## 🔄 CI/CD Integration

The security tests are automatically run in GitHub Actions:

### Automated Testing
- **On Pull Requests**: Tests run on every PR to `main` or `develop`
- **On Push**: Tests run when code is pushed to main branches
- **Daily Schedule**: Tests run daily at 2 AM UTC
- **Manual Trigger**: Can be triggered manually from GitHub Actions tab

### GitHub Actions Workflow

The workflow is defined in `.github/workflows/security-tests.yml` and includes:

1. **Security Scan Job**
   - Builds and starts the application
   - Runs IDOR vulnerability tests
   - Runs input validation tests
   - Uploads test reports as artifacts
   - Comments on PRs with test results

2. **Dependency Audit Job**
   - Runs `pnpm audit` to check for vulnerable dependencies
   - Reports findings in GitHub Actions summary

### Setting Up GitHub Secrets

For the CI/CD pipeline to work, add these secrets to your GitHub repository:

```
Settings -> Secrets and variables -> Actions -> New repository secret
```

Required secrets:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key

### Viewing Test Results

1. Go to the **Actions** tab in your GitHub repository
2. Click on the **Security Tests** workflow
3. View the summary and download artifacts for detailed reports
4. On PRs, results are automatically commented

### Local Testing Before CI

Run tests locally before pushing:

```bash
# Make scripts executable (first time only)
chmod +x security-tests/*.sh

# Start your application
pnpm dev

# In another terminal, run tests
cd security-tests
./test-idor.sh
./test-input-validation.sh
```

## 🛡️ What Makes Flowstarter Secure?

Based on code review, Flowstarter implements several security best practices:

### ✅ Strong Points

1. **Row Level Security (RLS)**
   - Supabase RLS policies enforce user-level data isolation
   - Projects table has policies for SELECT, INSERT, UPDATE, DELETE
   - Uses Clerk JWT claims for authentication

2. **Input Validation**
   - Zod schemas validate all user inputs
   - Project names limited to 80 characters
   - Regex validation for allowed characters
   - Type-safe validation with TypeScript

3. **Parameterized Queries**
   - Supabase client automatically uses parameterized queries
   - No raw SQL string concatenation
   - Protected against SQL injection

4. **Authentication**
   - Clerk provides enterprise-grade authentication
   - JWT tokens with proper validation
   - Session management handled securely

5. **API Security**
   - Rate limiting via Arcjet
   - API routes use server-side authentication
   - Proper error handling without information leakage

### ⚠️ Areas to Review

1. **File Uploads**
   - Verify UploadThing configuration restricts file types
   - Consider adding file scanning for malware

2. **Content Security Policy**
   - Consider adding CSP headers
   - Prevent inline script execution

3. **API Key Management**
   - Ensure all API keys are in environment variables
   - Never exposed to client-side code

4. **Error Messages**
   - Avoid exposing stack traces in production
   - Generic error messages for users

## 🔍 Manual Testing Recommendations

### Testing IDOR with Real Users

1. **Create two test accounts:**
   ```
   User A: usera@test.com
   User B: userb@test.com
   ```

2. **As User A:**
   - Create a project and note its ID
   - Copy the project ID from the URL or API response

3. **As User B:**
   - Try to access User A's project:
     ```
     GET /api/projects/{user-a-project-id}
     ```
   - Try to modify it:
     ```
     PATCH /api/projects/{user-a-project-id}
     ```
   - Try to delete it:
     ```
     DELETE /api/projects/{user-a-project-id}
     ```

4. **Expected Result:**
   - All attempts should fail with 403 Forbidden or 404 Not Found
   - RLS policies should prevent cross-user access

### Testing with Browser DevTools

1. **Open DevTools** (F12)
2. **Network Tab** - Monitor API requests
3. **Console Tab** - Check for errors or exposed data
4. **Application Tab** - Inspect cookies and local storage

Look for:
- Exposed API keys or secrets
- Sensitive data in local storage
- Unencrypted sensitive data in cookies

## 🐛 Reporting Vulnerabilities

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. **DO** email security@flowstarter.io with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

3. **Follow responsible disclosure:**
   - Give the team time to fix the issue
   - Don't exploit the vulnerability
   - Don't share it publicly until patched

## 📚 Additional Resources

### Security Testing Tools

- **Burp Suite** - Professional web security testing
- **OWASP ZAP** - Free web application security scanner
- **Postman** - API testing and security testing
- **SQLMap** - Automated SQL injection testing

### Learning Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [HackerOne Disclosure Guidelines](https://www.hackerone.com/disclosure-guidelines)

## 🤝 Contributing

To add new security tests:

1. Create a new test script in this directory
2. Follow the existing PowerShell script structure
3. Add documentation to this README
4. Submit a pull request

## ⚖️ Legal Notice

These scripts are provided for testing **your own** Flowstarter installation only. 

**DO NOT** use these scripts to test:
- Production environments without authorization
- Third-party websites
- Any system you don't own or have explicit permission to test

Unauthorized security testing is illegal and can result in criminal charges.
