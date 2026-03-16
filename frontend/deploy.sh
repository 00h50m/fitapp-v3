#!/bin/bash
npm run build
cd build
cat > vercel.json << 'EOF'
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF
npx vercel --prod --yes --token vcp_8AJ8JNEEwaZXpENMpdlrQrmI09FfO9Fe0YbAoVawSlhlZlc51F39XLZU
