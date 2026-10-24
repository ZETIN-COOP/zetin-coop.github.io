export function createInquiryMailto(fields, language = 'ko') {
  const singleLine = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();
  const company = singleLine(fields.company);
  const category = singleLine(fields.type);
  const english = language === 'en';
  const subject = `[${english ? 'Project inquiry' : '프로젝트 문의'}] ${company} · ${category}`;
  const labels = english ? ['Company / organization', 'Contact name', 'Email', 'Inquiry area', 'Project details'] : ['기업·기관명', '담당자', '이메일', '문의 분야', '프로젝트 내용'];
  const body = `${labels[0]}: ${company}\n${labels[1]}: ${singleLine(fields.name)}\n${labels[2]}: ${singleLine(fields.email)}\n${labels[3]}: ${category}\n\n${labels[4]}\n${String(fields.message || '').trim()}`;
  return `mailto:zero2infi@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('inquiry-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(form));
    const language = document.documentElement.lang;
    window.location.href = createInquiryMailto(fields, language);
    form.querySelector('.inquiry-status').textContent = language === 'en' ? 'Review and send the draft in your email app. If it did not open, email us directly using the address above.' : '이메일 앱에서 내용을 확인한 뒤 보내주세요. 연결되지 않으면 위 이메일 주소로 문의해 주세요.';
  });
}
