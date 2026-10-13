/**
 * HooksFly form receiver. Open this from the target Google Sheet.
 * Run setupSheet once, then deploy: Web app / Execute as Me / Anyone.
 * Column order may change; keep unique headings in row 1.
 */
const SHEET_NAME = 'Hooksfly Leads';
const HEADERS = ['Submitted at','Full name','Phone','Email','Creatives per month','Services you need','Source','Submission ID','Consent'];
const VOLUMES = ['50+','100+','150+','200+'];
const SERVICES = ['Creative','Website','FB Ads'];

function book_() {
  const id = PropertiesService.getScriptProperties().getProperty('HOOKSFLY_SHEET_ID');
  if (!id) throw new Error('Run setupSheet from the target Google Sheet first.');
  return SpreadsheetApp.openById(id);
}
function key_(value) {
  const key = String(value || '').trim().toLowerCase();
  return key === 'services needed' ? 'services you need' : key;
}
function columns_(sheet) {
  const map = Object.create(null);
  sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].forEach(function(value,index) {
    const key = key_(value);
    if (!key) return;
    if (map[key] !== undefined) throw new Error('Duplicate column: ' + value);
    map[key] = index;
  });
  return map;
}
function sheet_() {
  const book = book_();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);
  if (!sheet.getLastRow()) sheet.appendRow(HEADERS);
  const map = columns_(sheet);
  HEADERS.forEach(function(header) {
    if (map[key_(header)] === undefined) sheet.getRange(1,sheet.getLastColumn()+1).setValue(header);
  });
  return sheet;
}
function setupSheet() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Open the target Sheet, then Extensions > Apps Script.');
  PropertiesService.getScriptProperties().setProperty('HOOKSFLY_SHEET_ID',active.getId());
  const sheet = sheet_();
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,sheet.getLastColumn()).setFontWeight('bold').setBackground('#17345c').setFontColor('#ffffff');
  sheet.autoResizeColumns(1,sheet.getLastColumn());
  console.log('Ready: ' + active.getName() + ' / ' + SHEET_NAME);
}
function validId_(id) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(String(id || ''));
}
function safe_(value) {
  const text = String(value || '').trim();
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}
function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function exists_(sheet,id) {
  if (!sheet || sheet.getLastRow()<2) return false;
  const index = columns_(sheet)['submission id'];
  if (index === undefined) return false;
  return !!sheet.getRange(2,index+1,sheet.getLastRow()-1,1).createTextFinder(id).matchEntireCell(true).findNext();
}
function doPost(e) {
  let id = '', lock;
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length>5000) return json_({ok:false});
    const p = JSON.parse(raw);
    id = String(p.requestId || '');
    if (!validId_(id)) return json_({ok:false});
    const name = String(p.name || '').trim(), phone = String(p.phone || '').trim(), email = String(p.email || '').trim();
    const volume = String(p.volume || '');
    const services = Array.isArray(p.services) ? [...new Set(p.services)] : [];
    const digits = phone.replace(/\D/g,'');
    if (!name || name.length>80 || phone.length>20 || digits.length<10 || digits.length>15 ||
        email.length>150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !VOLUMES.includes(volume) || !services.length || services.some(s=>!SERVICES.includes(s)) ||
        p.website || p.consent!==true) {
      CacheService.getScriptCache().put('lead:'+id,'error',600);
      return json_({ok:false});
    }
    lock = LockService.getScriptLock();
    lock.waitLock(20000);
    const sheet = sheet_();
    if (!exists_(sheet,id)) {
      const map = columns_(sheet), row = new Array(sheet.getLastColumn()).fill('');
      const values = {'submitted at':new Date(),'full name':safe_(name),'phone':safe_(phone),'email':safe_(email),
        'creatives per month':volume,'services you need':services.join(', '),'source':'Hooksfly website','submission id':id,'consent':'Yes'};
      Object.keys(values).forEach(key=>{ row[map[key]]=values[key]; });
      sheet.appendRow(row);
      SpreadsheetApp.flush();
    }
    CacheService.getScriptCache().put('lead:'+id,'saved',21600);
    return json_({ok:true});
  } catch(error) {
    console.error(String(error));
    if (validId_(id)) { try { CacheService.getScriptCache().put('lead:'+id,'error',600); } catch(_) {} }
    return json_({ok:false});
  } finally { if (lock && lock.hasLock()) lock.releaseLock(); }
}
function doGet(e) {
  const p = e && e.parameter || {}, id = String(p.requestId || ''), callback = String(p.callback || '');
  if (p.action!=='status' || !validId_(id) || !/^hooksflyStatus_[a-f0-9]{32}$/.test(callback)) return json_({ok:false});
  let state = 'pending';
  try {
    state = CacheService.getScriptCache().get('lead:'+id) || 'pending';
    if (state!=='saved' && exists_(book_().getSheetByName(SHEET_NAME),id)) state='saved';
  } catch(error) { console.error(String(error)); state='error'; }
  return ContentService.createTextOutput(callback+'('+JSON.stringify({state:state})+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

