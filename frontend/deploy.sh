#!/bin/bash
set -e
echo "Building..."
npm run build
echo "Deploying to app-santana-method..."
cd build
rm -rf .vercel
mkdir -p .vercel
echo '{"projectId":"prj_waKWdiSIwkRt7lZARhkLRZrLkEKb","orgId":"team_wYqZ1DdXr5S5hrDiVQfdjxpb","projectName":"app-santana-method"}' > .vercel/project.json
echo '{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}' > vercel.json
npx vercel --prod --yes --token vcp_8AJ8JNEEwaZXpENMpdlrQrmI09FfO9Fe0YbAoVawSlhlZlc51F39XLZU
