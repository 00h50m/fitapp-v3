#!/bin/bash
set -e

TOKEN="${VERCEL_TOKEN}"
PROJECT_ID="prj_ogfWvKAq09Gm7r2MBNjsqHraCvAo"
ORG_ID="team_wYqZ1DdXr5S5hrDiVQfdjxpb"

if [ -z "$TOKEN" ]; then
  echo "❌ Defina VERCEL_TOKEN antes de rodar: export VERCEL_TOKEN=seu_token"
  exit 1
fi

echo "🔨 Buildando..."
cd /app/frontend
npm run build

echo "📁 Preparando pasta de deploy..."
rm -rf /tmp/deploy
mkdir -p /tmp/deploy
cp -r build/. /tmp/deploy

echo "📝 Criando vercel.json..."
echo '{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}' > /tmp/deploy/vercel.json

echo "🔗 Configurando projeto..."
mkdir -p /tmp/deploy/.vercel
cat > /tmp/deploy/.vercel/project.json << EOF
{"projectId":"$PROJECT_ID","orgId":"$ORG_ID"}
EOF

echo "🚀 Deployando..."
cd /tmp/deploy
VERCEL_ORG_ID=$ORG_ID VERCEL_PROJECT_ID=$PROJECT_ID npx vercel --prod --yes --token $TOKEN

echo "✅ https://team-santana.vercel.app"
