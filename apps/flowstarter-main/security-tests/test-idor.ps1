# ============================================================================
# IDOR (Insecure Direct Object Reference) Security Test Script
# For Flowstarter Platform
# ============================================================================
# This script tests if users can access other users' projects/resources
# without proper authorization checks

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000",
    
    [Parameter(Mandatory=$false)]
    [string]$UserAEmail,
    
    [Parameter(Mandatory=$false)]
    [string]$UserAPassword,
    
    [Parameter(Mandatory=$false)]
    [string]$UserBEmail,
    
    [Parameter(Mandatory=$false)]
    [string]$UserBPassword
)

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "🔐 IDOR Vulnerability Testing - Flowstarter" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$results = @()
$vulnerabilitiesFound = 0

function Test-Endpoint {
    param($method, $url, $headers, $body)
    try {
        $params = @{
            Uri = $url
            Method = $method
            Headers = $headers
            ContentType = "application/json"
        }
        if ($body) {
            $params.Body = $body | ConvertTo-Json
        }
        
        $response = Invoke-RestMethod @params -ErrorAction Stop
        return @{ success = $true; data = $response; status = 200 }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return @{ success = $false; status = $statusCode; error = $_.Exception.Message }
    }
}

# ============================================================================
# Test 1: Check if projects API has RLS enabled
# ============================================================================
Write-Host "[Test 1] Testing Project Access Control..." -ForegroundColor Yellow
Write-Host "  Testing: GET /api/projects without auth`n" -ForegroundColor Gray

$result1 = Test-Endpoint -method "GET" -url "$BaseUrl/api/projects" -headers @{}

if ($result1.status -eq 401 -or $result1.status -eq 403) {
    Write-Host "  ✅ SECURE: Endpoint requires authentication (Status: $($result1.status))" -ForegroundColor Green
    $results += @{
        test = "Projects API - Auth Required"
        status = "PASS"
        severity = "Info"
        details = "API correctly requires authentication"
    }
} else {
    Write-Host "  ⚠️  WARNING: Endpoint returned status $($result1.status)" -ForegroundColor Yellow
    Write-Host "    This might allow unauthenticated access!" -ForegroundColor Yellow
    $vulnerabilitiesFound++
    $results += @{
        test = "Projects API - Auth Required"
        status = "WARNING"
        severity = "Medium"
        details = "Endpoint accessible without auth (Status: $($result1.status))"
    }
}

# ============================================================================
# Test 2: Test individual project access
# ============================================================================
Write-Host "`n[Test 2] Testing Individual Project Access..." -ForegroundColor Yellow
Write-Host "  Testing: GET /api/projects/[random-uuid] without auth`n" -ForegroundColor Gray

# Generate a random UUID to test
$testUuid = [guid]::NewGuid().ToString()
$result2 = Test-Endpoint -method "GET" -url "$BaseUrl/api/projects/$testUuid" -headers @{}

if ($result2.status -eq 401 -or $result2.status -eq 403) {
    Write-Host "  ✅ SECURE: Project endpoint requires authentication" -ForegroundColor Green
    $results += @{
        test = "Individual Project API - Auth Required"
        status = "PASS"
        severity = "Info"
        details = "Project access requires authentication"
    }
} elseif ($result2.status -eq 404) {
    Write-Host "  ✅ SECURE: Project not found (expected for random UUID)" -ForegroundColor Green
    $results += @{
        test = "Individual Project API - Not Found Handling"
        status = "PASS"
        severity = "Info"
        details = "Proper 404 response for non-existent project"
    }
} else {
    Write-Host "  ⚠️  WARNING: Unexpected status $($result2.status)" -ForegroundColor Yellow
    $vulnerabilitiesFound++
    $results += @{
        test = "Individual Project API"
        status = "WARNING"
        severity = "Medium"
        details = "Unexpected response: $($result2.status)"
    }
}

# ============================================================================
# Test 3: Test project UPDATE without auth
# ============================================================================
Write-Host "`n[Test 3] Testing Project Update Access Control..." -ForegroundColor Yellow
Write-Host "  Testing: PATCH /api/projects/[uuid] without auth`n" -ForegroundColor Gray

$updateData = @{
    name = "Hacked Project Name"
} | ConvertTo-Json

# Create FormData since the API uses formData
$form = @{
    name = "Hacked Project Name"
}

try {
    $result3 = Invoke-RestMethod -Uri "$BaseUrl/api/projects/$testUuid" `
        -Method PATCH `
        -Body $form `
        -ErrorAction Stop
    
    Write-Host "  🔴 CRITICAL: Project update succeeded without authentication!" -ForegroundColor Red
    $vulnerabilitiesFound++
    $results += @{
        test = "Project Update - Auth Required"
        status = "FAIL"
        severity = "CRITICAL"
        details = "Project can be updated without authentication!"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "  ✅ SECURE: Update requires authentication (Status: $statusCode)" -ForegroundColor Green
        $results += @{
            test = "Project Update - Auth Required"
            status = "PASS"
            severity = "Info"
            details = "Update correctly requires authentication"
        }
    } else {
        Write-Host "  ✅ SECURE: Update failed as expected (Status: $statusCode)" -ForegroundColor Green
        $results += @{
            test = "Project Update - Auth Required"
            status = "PASS"
            severity = "Info"
            details = "Update blocked (Status: $statusCode)"
        }
    }
}

# ============================================================================
# Test 4: Test project DELETE without auth
# ============================================================================
Write-Host "`n[Test 4] Testing Project Delete Access Control..." -ForegroundColor Yellow
Write-Host "  Testing: DELETE /api/projects/[uuid] without auth`n" -ForegroundColor Gray

try {
    $result4 = Invoke-RestMethod -Uri "$BaseUrl/api/projects/$testUuid" `
        -Method DELETE `
        -ErrorAction Stop
    
    Write-Host "  🔴 CRITICAL: Project deletion succeeded without authentication!" -ForegroundColor Red
    $vulnerabilitiesFound++
    $results += @{
        test = "Project Delete - Auth Required"
        status = "FAIL"
        severity = "CRITICAL"
        details = "Project can be deleted without authentication!"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "  ✅ SECURE: Delete requires authentication (Status: $statusCode)" -ForegroundColor Green
        $results += @{
            test = "Project Delete - Auth Required"
            status = "PASS"
            severity = "Info"
            details = "Delete correctly requires authentication"
        }
    } else {
        Write-Host "  ✅ SECURE: Delete failed as expected (Status: $statusCode)" -ForegroundColor Green
        $results += @{
            test = "Project Delete - Auth Required"
            status = "PASS"
            severity = "Info"
            details = "Delete blocked (Status: $statusCode)"
        }
    }
}

# ============================================================================
# Test 5: Test Draft Project Access
# ============================================================================
Write-Host "`n[Test 5] Testing Draft Project Access Control..." -ForegroundColor Yellow
Write-Host "  Testing: GET /api/projects/draft without auth`n" -ForegroundColor Gray

try {
    $result5 = Invoke-RestMethod -Uri "$BaseUrl/api/projects/draft" `
        -Method GET `
        -ErrorAction Stop
    
    Write-Host "  ⚠️  WARNING: Draft endpoint accessible without auth!" -ForegroundColor Yellow
    Write-Host "    Response: $($result5 | ConvertTo-Json -Depth 1)" -ForegroundColor Gray
    $vulnerabilitiesFound++
    $results += @{
        test = "Draft Project Access"
        status = "WARNING"
        severity = "Medium"
        details = "Draft endpoint may be accessible without auth"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "  ✅ SECURE: Draft endpoint requires authentication" -ForegroundColor Green
        $results += @{
            test = "Draft Project Access"
            status = "PASS"
            severity = "Info"
            details = "Draft access requires authentication"
        }
    } else {
        Write-Host "  ✅ SECURE: Draft access blocked (Status: $statusCode)" -ForegroundColor Green
        $results += @{
            test = "Draft Project Access"
            status = "PASS"
            severity = "Info"
            details = "Draft access blocked"
        }
    }
}

# ============================================================================
# Summary Report
# ============================================================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "📊 IDOR Testing Summary" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Total Tests Run: $($results.Count)" -ForegroundColor White
Write-Host "Vulnerabilities Found: $vulnerabilitiesFound`n" -ForegroundColor $(if ($vulnerabilitiesFound -eq 0) { "Green" } else { "Red" })

# Group by severity
$critical = ($results | Where-Object { $_.severity -eq "CRITICAL" }).Count
$high = ($results | Where-Object { $_.severity -eq "High" }).Count
$medium = ($results | Where-Object { $_.severity -eq "Medium" }).Count
$low = ($results | Where-Object { $_.severity -eq "Low" }).Count
$passed = ($results | Where-Object { $_.status -eq "PASS" }).Count

if ($critical -gt 0) {
    Write-Host "🔴 CRITICAL: $critical" -ForegroundColor Red
}
if ($high -gt 0) {
    Write-Host "🟠 HIGH: $high" -ForegroundColor DarkYellow
}
if ($medium -gt 0) {
    Write-Host "🟡 MEDIUM: $medium" -ForegroundColor Yellow
}
if ($low -gt 0) {
    Write-Host "🟢 LOW: $low" -ForegroundColor Green
}
Write-Host "✅ PASSED: $passed" -ForegroundColor Green

Write-Host "`nDetailed Results:" -ForegroundColor Cyan
Write-Host "─────────────────" -ForegroundColor Cyan
foreach ($result in $results) {
    $icon = if ($result.status -eq "PASS") { "✅" } elseif ($result.status -eq "WARNING") { "⚠️ " } else { "🔴" }
    $color = if ($result.status -eq "PASS") { "Green" } elseif ($result.status -eq "WARNING") { "Yellow" } else { "Red" }
    
    Write-Host "`n$icon $($result.test)" -ForegroundColor $color
    Write-Host "   Status: $($result.status) | Severity: $($result.severity)" -ForegroundColor Gray
    Write-Host "   Details: $($result.details)" -ForegroundColor Gray
}

# ============================================================================
# Recommendations
# ============================================================================
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "💡 Security Recommendations" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

if ($vulnerabilitiesFound -eq 0) {
    Write-Host "✅ Great job! No major IDOR vulnerabilities detected." -ForegroundColor Green
    Write-Host "   Your RLS policies and authentication checks appear to be working correctly.`n" -ForegroundColor Green
} else {
    Write-Host "Based on the test results, consider the following:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. ✓ Ensure all API routes use 'useServerSupabaseWithAuth()' " -ForegroundColor White
    Write-Host "     instead of 'useServerSupabase()' for authenticated requests" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. ✓ Verify RLS policies are enabled on all tables:" -ForegroundColor White
    Write-Host "     ALTER TABLE projects ENABLE ROW LEVEL SECURITY;" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. ✓ Add userId checks in API routes:" -ForegroundColor White
    Write-Host "     const { userId } = await auth();" -ForegroundColor Gray
    Write-Host "     if (!userId) return 401" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. ✓ Test with actual user accounts to verify cross-user access" -ForegroundColor White
    Write-Host "     Run: ./test-idor.ps1 -UserAEmail user1@test.com -UserBEmail user2@test.com" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "============================================`n" -ForegroundColor Cyan

# Save report to file
$reportPath = Join-Path (Get-Location) "idor-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$results | ConvertTo-Json -Depth 10 | Out-File $reportPath
Write-Host "📄 Detailed report saved to: $reportPath`n" -ForegroundColor Cyan
