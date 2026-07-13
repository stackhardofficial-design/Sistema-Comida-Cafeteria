$SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bHVremp1Y3hnamptdmJ0ZXVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU1ODMzNCwiZXhwIjoyMDk5MTM0MzM0fQ.m1gNMaOMVQznTtwTpHSxBPcgqUm5URi_vYQYndHyZ1c'
$BASE = 'https://mylukzjucxgjjmvbteuf.supabase.co/rest/v1'
$h = @{ "apikey"=$SERVICE;"Authorization"="Bearer $SERVICE";"Content-Type"="application/json";"Prefer"="return=representation" }
$tenantId = '56e7c452-b49f-4192-8fbd-283e5af0a3aa'
$zone1Id = '5a37e5a4-bc7b-47e2-8775-b096239185f9'
$zone2Id = 'bbe238d8-e9d6-42c3-9640-205b9889493b'

# Delete existing tables
Invoke-RestMethod -Uri "$BASE/restaurant_tables?tenant_id=eq.$tenantId" -Method DELETE -Headers $h

# Create Zone 1 tables
for ($i = 1; $i -le 8; $i++) {
    $body = @{tenant_id=$tenantId;zone_id=$zone1Id;name="Mesa $i";capacity=4;status="free";is_active=$true} | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE/restaurant_tables" -Method POST -Headers $h -Body $body | Out-Null
}
Write-Host "Created Zone 1"

# Create Zone 2 tables
for ($i = 9; $i -le 12; $i++) {
    $body = @{tenant_id=$tenantId;zone_id=$zone2Id;name="Mesa $i";capacity=4;status="free";is_active=$true} | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE/restaurant_tables" -Method POST -Headers $h -Body $body | Out-Null
}
Write-Host "Created Zone 2"
Write-Host "Done"
