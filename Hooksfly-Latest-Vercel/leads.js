'use strict';
// Only a positive acknowledgement from Google Sheets marks an enquiry as saved.
function attachLeadForm(form) {
  const status = document.getElementById('formStatus');
  const button = form.querySelector('button[type="submit"]');
  let busy = false;
  let submissionId = null;
  let fingerprint = '';
  const setStatus = (message, state) => {status.textContent=message;status.dataset.state=state;};
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    const fields = new FormData(form);
    const payload = {name: String(fields.get('name')||'').trim(),phone:String(fields.get('phone')||'').trim(),email:String(fields.get('email')||'').trim(),volume:String(fields.get('volume')||''),website:String(fields.get('website')||''),consent:form.querySelector('.consent input').checked};
    payload.services=fields.getAll('services');
    if(!payload.services.length){setStatus('Please select at least one service.','error');form.querySelector('.service-select').open=true;return;}
    if (!payload.name) {form.elements.name.setCustomValidity('Please enter your name.');form.elements.name.reportValidity();return;}
    const digits=payload.phone.replace(/\D/g,'');
    if(digits.length<10||digits.length>15){form.elements.phone.setCustomValidity('Enter a valid phone number with 10 to 15 digits.');form.elements.phone.reportValidity();return;}
    if(!form.reportValidity()) return;
    const endpoint=window.HOOKSFLY_CONFIG?.googleScriptUrl||'';
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) {setStatus('Online enquiries are temporarily unavailable. Please try again later.','error');return;}
    const currentFingerprint=JSON.stringify(payload);
    if(currentFingerprint!==fingerprint||!submissionId){submissionId=crypto.randomUUID();fingerprint=currentFingerprint;}
    payload.requestId=submissionId;payload.source='Hooksfly website';
    busy=true;button.disabled=true;button.textContent='Sending your enquiry…';setStatus('Sending your enquiry…','pending');
    try {
      // A cross-origin redirect may fail in the browser after Google has saved the row.
      // Always check the receipt, including when the POST fetch rejects.
      try {
        await fetch(endpoint,{method:'POST',mode:'no-cors',credentials:'omit',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),signal:leadRequestSignal(45000)});
      } catch (transportError) { /* The receipt below decides whether the lead was saved. */ }
      const saved=await confirmLead(endpoint,submissionId);
      if(!saved)throw new Error('unconfirmed');
      setStatus('Thank you! Your enquiry has been submitted. The Hooksfly team will contact you about your creative plan.','success');
      form.reset();submissionId=null;fingerprint='';
    } catch(error) {
      setStatus('We could not confirm that your enquiry was saved. Please try again shortly.','error');
    } finally {busy=false;button.disabled=false;button.textContent='Register for Free Creatives';}
  });
}
async function confirmLead(endpoint,id){
  const callback='hooksflyStatus_'+id.replaceAll('-','');
  for(let attempt=0;attempt<4;attempt++){
    const url=endpoint+'?action=status&requestId='+encodeURIComponent(id)+'&callback='+callback+'&t='+Date.now();
    let result;
    try {
      const response=await fetch(url,{credentials:'omit',cache:'no-store',signal:leadRequestSignal(20000)});
      if(!response.ok)throw new Error('receipt_http');
      const body=(await response.text()).trim();
      // Parse the permitted callback envelope as data; never execute returned text.
      const prefix=callback+'(';
      if(!body.startsWith(prefix)||!body.endsWith(');'))throw new Error('receipt_format');
      result=JSON.parse(body.slice(prefix.length,-2));
    } catch(error) {
      result=await readReceiptScript(url,callback);
    }
    if(result?.state==='saved')return true;
    if(result?.state==='error')return false;
    if(attempt<3)await new Promise(resolve=>setTimeout(resolve,2000));
  }
  return false;
}
function leadRequestSignal(ms){
  return typeof AbortSignal!=='undefined'&&typeof AbortSignal.timeout==='function'?AbortSignal.timeout(ms):undefined;
}
function readReceiptScript(url,callback){
  return new Promise(resolve=>{
    const script=document.createElement('script');
    let settled=false;
    const finish=result=>{
      if(settled)return;
      settled=true;clearTimeout(timer);script.remove();
      // Late responses are harmless if a request has timed out.
      window[callback]=()=>{};
      resolve(result);
    };
    const timer=setTimeout(()=>finish(null),45000);
    window[callback]=finish;
    script.crossOrigin='anonymous';
    script.referrerPolicy='no-referrer';
    script.src=url;
    script.onerror=()=>finish(null);
    document.head.appendChild(script);
  });
}
