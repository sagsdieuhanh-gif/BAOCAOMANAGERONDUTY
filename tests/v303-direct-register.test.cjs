'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),admin=fs.readFileSync('rns-admin.js','utf8');
for(const id of ['rnsCreatePanel','rnsCreateEmail','rnsCreateName','rnsCreateUnit',
 'rnsCreateRnsRole','rnsCreateVerifiedEmail','rnsCreateButton','rnsCreateSecretPanel',
 'rnsCreatedPassword','rnsCreateCopy','rnsCreateDismiss']){
 assert.ok(html.includes('id="'+id+'"'),'Missing registration control '+id);
}
assert.match(admin,/invoke\('create',\{email,display_name:displayName,unit:target,/);
assert.ok(admin.includes('email_verified_by_admin:true'),'Account email must be confirmed by admin');
assert.ok(admin.includes('temporary_password'),'Temporary password must only come from server');
assert.ok(admin.includes("rnsCreateSecretPanel')?.classList.add('hidden')"),'One-time password must be erasable');
assert.ok(!html.includes('<option value="ADMIN">'),'Shared account quick create must never grant manager ADMIN');
assert.ok(html.includes('rns_must_change_password===true'),'New accounts must reset password via RNS before Manager');
assert.match(html,/const APP_VERSION='V3\.10'/);
console.log('PASS: V3.10 admin-only shared RNS/Manager creation UI, immediate roles and first-login reset');
