#!/bin/bash
set -e

echo "🔍 Checking database connection..."
npx prisma db execute --stdin <<EOF
SELECT 1;
EOF

echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed successfully!"

echo "🌱 Seeding database..."
npx prisma db seed

echo "✅ Database seeding completed!"

echo "🚀 Starting application server..."
node dist/server.js
