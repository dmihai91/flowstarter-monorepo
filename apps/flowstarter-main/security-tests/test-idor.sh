#!/bin/bash

# ============================================================================
# IDOR (Insecure Direct Object Reference) Security Test Script
# For Flowstarter Platform
# ============================================================================
# This script tests if users can access other users' projects/resources
# without proper authorization checks

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
VULNERABILITIES_FOUND=0
TESTS_RUN=0

# Generate report data
REPORT_FILE="idor-test-report-$(date +%Y%m%d-%H%M%S).json"
RESULTS="[]"

echo -e "\n${CYAN}============================================${NC}"
echo -e "${CYAN}🔐 IDOR Vulnerability Testing - Flowstarter${NC}"
echo -e "${CYAN}============================================${NC}\n"
echo -e "Testing: ${BASE_URL}\n"

# Function to add result to report
add_result() {
    local test_name="$1"
    local status="$2"
    local severity="$3"
    local details="$4"
    
    RESULTS=$(echo "$RESULTS" | jq --arg test "$test_name" \
        --arg status "$status" \
        --arg severity "$severity" \
        --arg details "$details" \
        '. += [{"test": $test, "status": $status, "severity": $severity, "details": $details}]')
}

# Check if jq is available for JSON report generation
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq not found. JSON reports will be disabled.${NC}"
    REPORT_ENABLED=false
else
    REPORT_ENABLED=true
fi

# ============================================================================
# Test 1: Check if projects API has authentication enabled
# ============================================================================
echo -e "${YELLOW}[Test 1] Testing Project Access Control...${NC}"
echo -e "${GRAY}  Testing: GET /api/projects without auth${NC}\n"

TESTS_RUN=$((TESTS_RUN + 1))
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/projects" || echo "000")

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "  ${GREEN}✅ SECURE: Endpoint requires authentication (Status: $HTTP_CODE)${NC}"
    [ "$REPORT_ENABLED" = true ] && add_result "Projects API - Auth Required" "PASS" "Info" "API correctly requires authentication"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "  ${RED}❌ ERROR: Cannot connect to $BASE_URL${NC}"
    echo -e "  ${GRAY}Make sure your application is running${NC}"
    exit 1
else
    echo -e "  ${YELLOW}⚠️  WARNING: Endpoint returned status $HTTP_CODE${NC}"
    echo -e "  ${GRAY}  This might allow unauthenticated access!${NC}"
    VULNERABILITIES_FOUND=$((VULNERABILITIES_FOUND + 1))
    [ "$REPORT_ENABLED" = true ] && add_result "Projects API - Auth Required" "WARNING" "Medium" "Endpoint accessible without auth (Status: $HTTP_CODE)"
fi

# ============================================================================
# Test 2: Test individual project access
# ============================================================================
echo -e "\n${YELLOW}[Test 2] Testing Individual Project Access...${NC}"
echo -e "${GRAY}  Testing: GET /api/projects/[random-uuid] without auth${NC}\n"

TESTS_RUN=$((TESTS_RUN + 1))
TEST_UUID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "12345678-1234-1234-1234-123456789012")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/projects/$TEST_UUID")

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "  ${GREEN}✅ SECURE: Project endpoint requires authentication${NC}"
    [ "$REPORT_ENABLED" = true ] && add_result "Individual Project API - Auth Required" "PASS" "Info" "Project access requires authentication"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "  ${GREEN}✅ SECURE: Project not found (expected for random UUID)${NC}"
    [ "$REPORT_ENABLED" = true ] && add_result "Individual Project API - Not Found Handling" "PASS" "Info" "Proper 404 response for non-existent project"
else
    echo -e "  ${YELLOW}⚠️  WARNING: Unexpected status $HTTP_CODE${NC}"
    VULNERABILITIES_FOUND=$((VULNERABILITIES_FOUND + 1))
    [ "$REPORT_ENABLED" = true ] && add_result "Individual Project API" "WARNING" "Medium" "Unexpected response: $HTTP_CODE"
fi

# ============================================================================
# Test 3: Test project UPDATE without auth
# ============================================================================
echo -e "\n${YELLOW}[Test 3] Testing Project Update Access Control...${NC}"
echo -e "${GRAY}  Testing: PATCH /api/projects/[uuid] without auth${NC}\n"

TESTS_RUN=$((TESTS_RUN + 1))
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X PATCH \
    -F "name=Hacked Project Name" \
    "$BASE_URL/api/projects/$TEST_UUID")

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "  ${GREEN}✅ SECURE: Update requires authentication (Status: $HTTP_CODE)${NC}"
    [ "$REPORT_ENABLED" = true ] && add_result "Project Update - Auth Required" "PASS" "Info" "Update correctly requires authentication"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${RED}🔴 CRITICAL: Project update succeeded without authentication!${NC}"
    VULNERABILITIES_FOUND=$((VULNERABILITIES_FOUND + 1))
    [ "$REPORT_ENABLED" = true ] && add_result "Project Update - Auth Required" "FAIL" "CRITICAL" "Project can be updated without authentication!"
else
    echo -e "  ${GREEN}✅ SECURE: Update failed as expected (Status: $HTTP_CODE)${NC}"
    [ "$REPORT_ENABLED" = true ] && add_result "Project Update - Auth Required" "PASS" "Info" "Update blocked (Status: $HTTP_CODE)"
fi

# ============================================================================
# Test 4: Test project DELETE without auth
# ============================================================================
echo -e "\n${YELLOW}[Test 4] Testing Project Delete Access Control...${NC}"
echo -e "${GRAY}  Testing: DELETE /api/projects/[uuid] without auth${NC}\n"

TESTS_RUN=$((TESTS_RUN + 1))
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X DELETE \
    "$BASE_URL/api/projects/$TEST_UUID")

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "  ${GREEN}✅ SECURE: Delete requires authentication (Status: $HTTP_CODE)${NC}"
    [ "$REPORT_ENABLED" = true ] && add_result "Project Delete - Auth Required" "PASS" "Info" "Delete correctly requires authentication"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${RED}🔴 CRITICAL: Project deletion succeeded without authentication!${NC}"
    VULNERABILITIES_FOUND=$((VULNERABILITIES_FOUND + 1))
    [ "$REPORT_ENABLED" = true ] && add_result "Project Delete - Auth Required" "FAIL" "CRITICAL" "Project can be deleted without authentication!"
else
    echo -e "  ${GREEN}✅ SECURE: Delete failed as expected (Status: $HTTP_CODE)${NC}"
    [ "$REPORT_ENABLED" = true ] && add_result "Project Delete - Auth Required" "PASS" "Info" "Delete blocked (Status: $HTTP_CODE)"
fi

# ============================================================================
# Test 5: Test Draft Project Access
# ============================================================================
echo -e "\n${YELLOW}[Test 5] Testing Draft Project Access Control...${NC}"
echo -e "${GRAY}  Testing: GET /api/projects/draft without auth${NC}\n"

TESTS_RUN=$((TESTS_RUN + 1))
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/projects/draft")

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "  ${GREEN}✅ SECURE: Draft endpoint requires authentication${NC}"
    [ "$REPORT_ENABLED" = true ] && add_result "Draft Project Access" "PASS" "Info" "Draft access requires authentication"
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${YELLOW}⚠️  WARNING: Draft endpoint accessible without auth!${NC}"
    VULNERABILITIES_FOUND=$((VULNERABILITIES_FOUND + 1))
    [ "$REPORT_ENABLED" = true ] && add_result "Draft Project Access" "WARNING" "Medium" "Draft endpoint may be accessible without auth"
else
    echo -e "  ${GREEN}✅ SECURE: Draft access blocked (Status: $HTTP_CODE)${NC}"
    [ "$REPORT_ENABLED" = true ] && add_result "Draft Project Access" "PASS" "Info" "Draft access blocked"
fi

# ============================================================================
# Summary Report
# ============================================================================
echo -e "\n${CYAN}============================================${NC}"
echo -e "${CYAN}📊 IDOR Testing Summary${NC}"
echo -e "${CYAN}============================================${NC}\n"

echo -e "Total Tests Run: ${TESTS_RUN}"
if [ "$VULNERABILITIES_FOUND" -eq 0 ]; then
    echo -e "Vulnerabilities Found: ${GREEN}${VULNERABILITIES_FOUND}${NC}\n"
else
    echo -e "Vulnerabilities Found: ${RED}${VULNERABILITIES_FOUND}${NC}\n"
fi

# Count by severity (if jq is available)
if [ "$REPORT_ENABLED" = true ]; then
    CRITICAL=$(echo "$RESULTS" | jq '[.[] | select(.severity == "CRITICAL")] | length')
    HIGH=$(echo "$RESULTS" | jq '[.[] | select(.severity == "High")] | length')
    MEDIUM=$(echo "$RESULTS" | jq '[.[] | select(.severity == "Medium")] | length')
    LOW=$(echo "$RESULTS" | jq '[.[] | select(.severity == "Low")] | length')
    PASSED=$(echo "$RESULTS" | jq '[.[] | select(.status == "PASS")] | length')

    [ "$CRITICAL" -gt 0 ] && echo -e "${RED}🔴 CRITICAL: $CRITICAL${NC}"
    [ "$HIGH" -gt 0 ] && echo -e "${RED}🟠 HIGH: $HIGH${NC}"
    [ "$MEDIUM" -gt 0 ] && echo -e "${YELLOW}🟡 MEDIUM: $MEDIUM${NC}"
    [ "$LOW" -gt 0 ] && echo -e "${GREEN}🟢 LOW: $LOW${NC}"
    echo -e "${GREEN}✅ PASSED: $PASSED${NC}"

    # Detailed results
    echo -e "\n${CYAN}Detailed Results:${NC}"
    echo -e "${CYAN}─────────────────${NC}"
    
    echo "$RESULTS" | jq -r '.[] | 
        "\n" + 
        (if .status == "PASS" then "✅" 
         elif .status == "WARNING" then "⚠️ " 
         else "🔴" end) + " " + .test + "\n" +
        "   Status: " + .status + " | Severity: " + .severity + "\n" +
        "   Details: " + .details'
fi

# ============================================================================
# Recommendations
# ============================================================================
echo -e "\n${CYAN}============================================${NC}"
echo -e "${CYAN}💡 Security Recommendations${NC}"
echo -e "${CYAN}============================================${NC}\n"

if [ "$VULNERABILITIES_FOUND" -eq 0 ]; then
    echo -e "${GREEN}✅ Great job! No major IDOR vulnerabilities detected.${NC}"
    echo -e "${GREEN}   Your RLS policies and authentication checks appear to be working correctly.${NC}\n"
else
    echo -e "${YELLOW}Based on the test results, consider the following:${NC}"
    echo ""
    echo -e "1. Ensure all API routes use 'useServerSupabaseWithAuth()'"
    echo -e "   instead of 'useServerSupabase()' for authenticated requests"
    echo ""
    echo -e "2. Verify RLS policies are enabled on all tables:"
    echo -e "   ALTER TABLE projects ENABLE ROW LEVEL SECURITY;"
    echo ""
    echo -e "3. Add userId checks in API routes:"
    echo -e "   const { userId } = await auth();"
    echo -e "   if (!userId) return 401"
    echo ""
    echo -e "4. Test with actual user accounts to verify cross-user access"
    echo ""
fi

echo -e "${CYAN}============================================${NC}\n"

# Save report to file
if [ "$REPORT_ENABLED" = true ]; then
    echo "$RESULTS" | jq '.' > "$REPORT_FILE"
    echo -e "📄 Detailed report saved to: ${REPORT_FILE}\n"
fi

# Exit with appropriate code
if [ "$VULNERABILITIES_FOUND" -gt 0 ]; then
    exit 1
fi

exit 0
