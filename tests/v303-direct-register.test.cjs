'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),admin=fs.readFileSync('rns-admin.js','utf8');
for(const id of ['rnsCreatePanel','rnsCreateEmail','rnsCreateName','rnsCreateUnit',
 'rnsCreateRnsRole','rnsCreateManagerAccess','rnsCreateRnsAccess','rnsCreateVerifiedEmail','rnsCreateButton','rnsCreateSecretPanel',
 'rnsCreatedPassword','rnsCreateCopy','rnsCreateDismiss']){
 assert.ok(html.includes('id="'+id+'"'),'Missing registration control '+id);
}
assert.ok(admin.includes("invoke('create',{email,display_name:displayName,unit:target"),'Create calls protected backend');
assert.ok(admin.includes('manager_access:managerAccess,rns_access:rnsAccess'),'Both access flags must be explicit');
assert.ok(admin.includes("invoke('delete_account'"),'Delete action must call backend');
assert.ok(admin.includes("invoke('set_app_access'"),'Access updates must be server-side');
assert.ok(admin.includes('email_verified_by_admin:true'),'Account email must be confirmed by admin');
assert.ok(admin.includes('temporary_password'),'Temporary password must only come from server');
assert.ok(admin.includes("rnsCreateSecretPanel')?.classList.add('hidden')"),'One-time password must be erasable');
assert.ok(!html.includes('<option value="ADMIN">'),'Shared account quick create must never grant manager ADMIN');
assert.ok(html.includes('rns_must_change_password===true'),'New accounts must reset password via RNS before Manager');
assert.match(html,/const APP_VERSION='V3\.26'/);
console.log('PASS: V3.10 admin-only shared RNS/Manager creation UI, immediate roles and first-login reset');
