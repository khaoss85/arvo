const TOKEN = process.argv[2]

if (!TOKEN) {
  console.error('Usage: tsx scripts/decode-token.ts <token>')
  process.exit(1)
}

const parts = TOKEN.split('.')
if (parts.length !== 3) {
  console.error('Invalid JWT token')
  process.exit(1)
}

const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
console.log('Token Payload:')
console.log(JSON.stringify(payload, null, 2))
console.log('\nUser ID (sub):', payload.sub)
console.log('Email:', payload.email)
console.log('Issued at:', new Date(payload.iat * 1000).toISOString())
console.log('Expires at:', new Date(payload.exp * 1000).toISOString())
console.log('Is expired?', Date.now() > payload.exp * 1000)
