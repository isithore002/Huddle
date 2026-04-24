@echo off
echo Starting Huddle Hackathon Stack...

echo [1/5] Starting Buyer AXL Node...
start "AXL Buyer Node" cmd /c "bin\axl-windows-amd64.exe -c configs\buyer-node.json"
timeout /t 1 /nobreak > NUL

echo [2/5] Starting Seller AXL Node...
start "AXL Seller Node" cmd /c "bin\axl-windows-amd64.exe -c configs\seller-node.json"
timeout /t 2 /nobreak > NUL

echo [3/5] Starting Seller Agent...
start "Seller Agent" cmd /c "node src\seller-agent\index.js"
timeout /t 1 /nobreak > NUL

echo [4/5] Starting Buyer Agent API...
start "Buyer Agent" cmd /c "node src\buyer-agent\index.js"
timeout /t 2 /nobreak > NUL

echo [5/5] Starting Next.js UI Frontend...
cd ui && npm run dev
