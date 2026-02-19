# Flowstarter Site Generation Test Script
# Run this from D:\Projects\flowstarter\flowstarter-editor with dev server running

$baseUrl = "http://localhost:5173"

function Test-SiteGeneration {
    param(
        [string]$Name,
        [hashtable]$Body
    )
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "TEST: $Name" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    $json = $Body | ConvertTo-Json -Depth 10
    Write-Host "Request body:" -ForegroundColor Gray
    Write-Host $json
    
    $startTime = Get-Date
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/api/generate-site" -Method POST -Body $json -ContentType "application/json" -TimeoutSec 300
        
        $duration = (Get-Date) - $startTime
        
        Write-Host "`nResponse received in $($duration.TotalSeconds.ToString('F1'))s" -ForegroundColor Green
        
        # Parse SSE events
        $events = $response.Content -split "`n`n" | Where-Object { $_ -match "^data:" }
        
        foreach ($event in $events) {
            $eventData = $event -replace "^data:\s*", ""
            try {
                $parsed = $eventData | ConvertFrom-Json
                
                if ($parsed.type -eq "progress") {
                    Write-Host "  [Progress] $($parsed.message)" -ForegroundColor Yellow
                }
                elseif ($parsed.type -eq "complete") {
                    Write-Host "`n  [Complete]" -ForegroundColor Green
                    Write-Host "    Success: $($parsed.result.success)"
                    Write-Host "    Files: $($parsed.result.files.Count)"
                    if ($parsed.result.preview) {
                        Write-Host "    Preview URL: $($parsed.result.preview.url)"
                    }
                    if ($parsed.result.costs) {
                        Write-Host "`n  [COSTS]" -ForegroundColor Magenta
                        Write-Host "    Total: `$$($parsed.result.costs.totalCostUSD.ToString('F4'))"
                        Write-Host "    Tokens: $($parsed.result.costs.totalTokens)"
                        Write-Host "    Duration: $($parsed.result.costs.durationMs)ms"
                        Write-Host "    Breakdown:"
                        foreach ($b in $parsed.result.costs.breakdown) {
                            Write-Host "      - $($b.model): $($b.promptTokens + $b.completionTokens) tokens, `$$($b.costUSD.ToString('F4'))"
                        }
                    }
                }
                elseif ($parsed.type -eq "error") {
                    Write-Host "  [ERROR] $($parsed.error)" -ForegroundColor Red
                }
            }
            catch {
                # Skip unparseable events
            }
        }
        
        return $true
    }
    catch {
        Write-Host "ERROR: $_" -ForegroundColor Red
        return $false
    }
}

function Test-Modification {
    param(
        [string]$Name,
        [string]$ProjectId,
        [string]$Instruction
    )
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "MODIFICATION TEST: $Name" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    # First test the router
    $routerBody = @{
        instruction = $Instruction
    } | ConvertTo-Json
    
    Write-Host "Testing router..." -ForegroundColor Gray
    try {
        $routerResponse = Invoke-WebRequest -Uri "$baseUrl/api/modification-router" -Method POST -Body $routerBody -ContentType "application/json" -TimeoutSec 30
        $routerResult = $routerResponse.Content | ConvertFrom-Json
        
        Write-Host "  Route: $($routerResult.decision.route)" -ForegroundColor Yellow
        Write-Host "  Confidence: $($routerResult.decision.confidence)"
        Write-Host "  Reason: $($routerResult.decision.reason)"
        Write-Host "  Latency: $($routerResult.latencyMs)ms"
    }
    catch {
        Write-Host "Router error: $_" -ForegroundColor Red
    }
}

# ============================================
# TEST 1: English site without integrations
# ============================================
$test1 = @{
    projectId = "test-en-$(Get-Date -Format 'HHmmss')"
    siteName = "TechStartup Pro"
    businessInfo = @{
        name = "TechStartup Pro"
        tagline = "Innovative Solutions for Modern Businesses"
        description = "We provide cutting-edge technology solutions to help businesses grow."
        services = @("Web Development", "Mobile Apps", "Cloud Solutions")
    }
    design = @{
        primaryColor = "#3B82F6"
        fontFamily = "Inter"
    }
    template = @{
        slug = "starter"
        name = "Starter Template"
    }
    language = "en"
    deployToPreview = $false
}

Test-SiteGeneration -Name "English Site (no integrations)" -Body $test1

# ============================================
# TEST 2: Romanian site without integrations
# ============================================
$test2 = @{
    projectId = "test-ro-$(Get-Date -Format 'HHmmss')"
    siteName = "Clinica Dentara Smile"
    businessInfo = @{
        name = "Clinica Dentara Smile"
        tagline = "Zambetul tau, prioritatea noastra"
        description = "Oferim servicii stomatologice de cea mai inalta calitate pentru intreaga familie."
        services = @("Implantologie", "Ortodontie", "Estetica dentara", "Chirurgie orala")
        contact = @{
            email = "contact@smile.ro"
            phone = "+40 722 123 456"
            address = "Str. Zambetului 10, Bucuresti"
        }
    }
    design = @{
        primaryColor = "#10B981"
        fontFamily = "Poppins"
    }
    template = @{
        slug = "starter"
        name = "Starter Template"
    }
    language = "ro"
    deployToPreview = $false
}

Test-SiteGeneration -Name "Romanian Site (no integrations)" -Body $test2

# ============================================
# TEST 3: English site WITH integrations
# ============================================
$test3 = @{
    projectId = "test-en-int-$(Get-Date -Format 'HHmmss')"
    siteName = "Wellness Studio"
    businessInfo = @{
        name = "Wellness Studio"
        tagline = "Your Journey to Better Health"
        description = "Premium yoga and wellness services in downtown."
        services = @("Yoga Classes", "Meditation", "Personal Training")
    }
    design = @{
        primaryColor = "#8B5CF6"
        fontFamily = "Lato"
    }
    template = @{
        slug = "starter"
        name = "Starter Template"
    }
    integrations = @(
        @{
            id = "booking"
            config = @{
                provider = "calendly"
                url = "https://calendly.com/wellness-studio"
            }
        },
        @{
            id = "newsletter"
            config = @{
                provider = "mailchimp"
                url = "https://wellness.us1.list-manage.com/subscribe/post"
            }
        }
    )
    language = "en"
    deployToPreview = $false
}

Test-SiteGeneration -Name "English Site WITH integrations (Calendly + Mailchimp)" -Body $test3

# ============================================
# TEST 4: Romanian site WITH integrations
# ============================================
$test4 = @{
    projectId = "test-ro-int-$(Get-Date -Format 'HHmmss')"
    siteName = "Salon Frumusete Elena"
    businessInfo = @{
        name = "Salon Frumusete Elena"
        tagline = "Frumusetea ta, pasiunea noastra"
        description = "Salon de infrumusetare premium cu servicii complete."
        services = @("Coafor", "Manichiura", "Tratamente faciale", "Masaj")
        contact = @{
            email = "rezervari@elena.ro"
            phone = "+40 733 456 789"
        }
    }
    design = @{
        primaryColor = "#EC4899"
        fontFamily = "Playfair Display"
    }
    template = @{
        slug = "starter"
        name = "Starter Template"
    }
    integrations = @(
        @{
            id = "booking"
            config = @{
                provider = "calcom"
                url = "https://cal.com/salon-elena"
            }
        }
    )
    language = "ro"
    deployToPreview = $false
}

Test-SiteGeneration -Name "Romanian Site WITH integration (Cal.com)" -Body $test4

# ============================================
# MODIFICATION ROUTER TESTS
# ============================================
Write-Host "`n`n============================================" -ForegroundColor Magenta
Write-Host "MODIFICATION ROUTER TESTS" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta

# Simple modifications (should route to 'simple')
$simpleTests = @(
    "Change the title to Welcome"
    "Update the button color to blue"
    "Fix the typo in the header"
    "Make the headline bigger"
    "Hide the newsletter section"
)

foreach ($test in $simpleTests) {
    Test-Modification -Name "Simple: $test" -Instruction $test
}

# Complex modifications (should route to 'gretly')
$complexTests = @(
    "Add a new page for our team members"
    "Redesign the entire homepage"
    "Add booking integration with Calendly"
    "Create a blog section with categories"
    "Add e-commerce functionality"
)

foreach ($test in $complexTests) {
    Test-Modification -Name "Complex: $test" -Instruction $test
}

Write-Host "`n`n============================================" -ForegroundColor Green
Write-Host "ALL TESTS COMPLETED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
